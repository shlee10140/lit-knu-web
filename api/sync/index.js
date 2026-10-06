const { getCosmosContainer, getInMemoryStore } = require('../shared/cosmosClient')
const { verifyAuth, sendJson } = require('../shared/auth')

module.exports = async function (context, req) {
  const auth = verifyAuth(req)
  const membersContainer = await getCosmosContainer('members', '/handle')
  const articlesContainer = await getCosmosContainer('articles', '/id')
  const faqsContainer = await getCosmosContainer('faqs', '/id')
  const inMemory = getInMemoryStore()

  // POST: Bulk push local snapshot to Azure Cosmos DB ([보안] 운영진 관리자 전용 권한)
  if (req.method === 'POST') {
    if (!auth.valid || !auth.isAdmin) {
      sendJson(context, 403, { success: false, message: '클라우드 일괄 동기화는 LIT 운영진 관리자 권한이 필요합니다.' })
      return
    }

    let payload = req.body || {}
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload)
      } catch (_) {
        payload = {}
      }
    }

    const members = payload.members || []
    const articles = payload.articles || []
    const faqs = payload.faqs || []

    let syncedMembers = 0
    let syncedArticles = 0
    let syncedFaqs = 0

    const blockedMockHandles = new Set([
      'shlee', 'minji_kim', 'junho_park', 'sujin_choi', 'dohyun_lee', 'chaewon_yoon', 'taeyang_jung', 'yejin_han', 'sanjun', 'aa'
    ])
    const blockedMockArticleIds = new Set([
      'art-1', 'art-2', 'art-3', 'art-4', 'art-5', 'art-6', 'art-1789899483060'
    ])

    try {
      if (membersContainer) {
        for (const m of members) {
          if (!m || !m.handle) continue
          if (blockedMockHandles.has(String(m.handle).trim().toLowerCase()) || m.name === '이승환') continue
          // 비밀번호 필드는 절대 덮어쓰지 않음
          const safeM = { ...m }
          delete safeM.password
          await membersContainer.items.upsert({
            ...safeM,
            id: m.handle,
            type: 'member',
            syncedAt: new Date().toISOString(),
          })
          syncedMembers++
        }
      }

      if (articlesContainer) {
        for (const a of articles) {
          if (!a || !a.id) continue
          if (blockedMockArticleIds.has(String(a.id).trim())) continue
          await articlesContainer.items.upsert({
            ...a,
            id: a.id,
            type: 'article',
            syncedAt: new Date().toISOString(),
          })
          syncedArticles++
        }
      }

      if (faqsContainer) {
        for (const f of faqs) {
          if (!f || !f.id) continue
          await faqsContainer.items.upsert({
            ...f,
            id: f.id,
            type: 'faq',
            syncedAt: new Date().toISOString(),
          })
          syncedFaqs++
        }
      }

      sendJson(context, 200, {
        success: true,
        syncedMembers,
        syncedArticles,
        syncedFaqs,
        timestamp: new Date().toISOString(),
        destination: 'Azure Cosmos DB (Dedicated Containers)',
      })
      return
    } catch (err) {
      context.log.error('Cosmos DB bulk sync error:', err)
    }

    // In-memory fallback
    inMemory.members = members.map((m) => {
      const s = { ...m }
      delete s.password
      return s
    })
    inMemory.articles = articles
    inMemory.faqs = faqs
    inMemory.lastSyncedAt = new Date().toISOString()

    sendJson(context, 200, {
      success: true,
      syncedMembers: members.length,
      syncedArticles: articles.length,
      syncedFaqs: faqs.length,
      timestamp: inMemory.lastSyncedAt,
      destination: 'In-Memory Cache (Azure Functions)',
    })
    return
  }

  // GET: Read all data
  if (req.method === 'GET') {
    try {
      let members = []
      let articles = []
      let faqs = []

      if (membersContainer) {
        const { resources } = await membersContainer.items.query('SELECT * FROM c').fetchAll()
        members = resources.map((m) => {
          const s = { ...m }
          delete s.password
          return s
        })
      }
      if (articlesContainer) {
        const { resources } = await articlesContainer.items.query('SELECT * FROM c').fetchAll()
        articles = resources
      }
      if (faqsContainer) {
        const { resources } = await faqsContainer.items.query('SELECT * FROM c').fetchAll()
        faqs = resources
      }

      sendJson(context, 200, {
        success: true,
        members,
        articles,
        faqs,
        count: members.length + articles.length + faqs.length,
        source: 'Azure Cosmos DB',
      })
      return
    } catch (err) {
      context.log.error('Cosmos DB read all error:', err)
    }

    sendJson(context, 200, {
      success: true,
      members: (inMemory.members || []).map((m) => {
        const s = { ...m }
        delete s.password
        return s
      }),
      articles: inMemory.articles || [],
      faqs: inMemory.faqs || [],
      source: 'In-Memory',
    })
    return
  }

  sendJson(context, 405, { success: false, message: 'Method Not Allowed' })
}
