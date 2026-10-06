const { getCosmosContainer } = require('../shared/cosmosClient')
const { verifyAuth, sendJson } = require('../shared/auth')

const PARTITION_KEY = '__milestones'
const DOC_ID = '__milestones'

const DEFAULT_MILESTONES = [
  { count: 50, title: '50 달성', icon: '🍩', badge: '50 달성', reward: '던킨 미니 도넛 세트', desc: '달콤한 에너지 충전! 첫 마일스톤 달성', color: 'amber' },
  { count: 100, title: '100 달성', icon: '🍔', badge: '100 달성', reward: '싸이버거 세트', desc: '든든한 한 끼 식사! 세 자릿수 돌파 축하', color: 'pink' },
  { count: 200, title: '200 달성', icon: '🛵', badge: '200 달성', reward: '배민 상품권', desc: '맛있는 만찬 즐기기! 2만원 배민 상품권', color: 'violet' },
  { count: 250, title: '250 달성', icon: '👑', badge: 'MSA 달성', reward: 'LIT 명예의 전당 (MSA 달성)', desc: '200명 채우면 250명은 스스로 욕심이 생겨서 달성!', color: 'gold' },
]

function sanitizeMilestones(list) {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_MILESTONES
  if (list.some((item) => Number(item.count) === 30 || Number(item.count) === 150)) {
    return DEFAULT_MILESTONES
  }
  return list
    .map((item) => {
      const rawCount = Number(item.count)
      const count = isNaN(rawCount) ? 0 : Math.max(0, rawCount)
      return {
        count,
        icon: String(item.icon || '🍩').trim(),
        reward: String(item.reward || '').trim(),
        desc: String(item.desc || '').trim(),
        title: item.title || `${count} 달성`,
        badge: item.badge || `${count} 달성`,
        color: item.color || (count >= 250 ? 'gold' : count >= 200 ? 'violet' : count >= 100 ? 'pink' : 'amber'),
      }
    })
    .sort((a, b) => a.count - b.count)
}

module.exports = async function (context, req) {
  const container = await getCosmosContainer('milestones', '/id')

  // 1. GET: 마일스톤 및 단계별 보상 목록 조회
  if (req.method === 'GET') {
    if (container) {
      try {
        const itemRes = await container.item(DOC_ID, DOC_ID).read().catch(() => null)
        if (itemRes && itemRes.resource) {
          const raw = itemRes.resource.milestones || itemRes.resource.data || []
          const hasLegacy = Array.isArray(raw) && (raw.some((m) => Number(m.count) === 30 || Number(m.count) === 150) || raw.length !== 4)
          const sanitized = sanitizeMilestones(raw)

          if (hasLegacy) {
            await container.items.upsert({
              id: DOC_ID,
              handle: PARTITION_KEY,
              type: 'milestones',
              milestones: DEFAULT_MILESTONES,
              updatedAt: new Date().toISOString(),
            }).catch(() => {})
          }

          sendJson(context, 200, { success: true, count: sanitized.length, data: sanitized, source: 'azure-cosmos-db' })
          return
        }

        const initialDoc = {
          id: DOC_ID,
          handle: PARTITION_KEY,
          type: 'milestones',
          milestones: DEFAULT_MILESTONES,
          updatedAt: new Date().toISOString(),
        }
        await container.items.upsert(initialDoc).catch(() => {})

        sendJson(context, 200, { success: true, count: DEFAULT_MILESTONES.length, data: DEFAULT_MILESTONES, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB milestones read error:', err)
      }
    }

    sendJson(context, 200, { success: true, count: DEFAULT_MILESTONES.length, data: DEFAULT_MILESTONES, source: 'fallback' })
    return
  }

  // 2. POST / PUT: 마일스톤 및 보상 업데이트 ([보안] 운영진 관리자 전용 권한)
  if (req.method === 'POST' || req.method === 'PUT') {
    const auth = verifyAuth(req)
    if (!auth.valid || !auth.isAdmin) {
      sendJson(context, 403, { success: false, message: '마일스톤 설정은 LIT 운영진 관리자 권한이 필요합니다.' })
      return
    }

    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (_) {
        body = {}
      }
    }

    const rawList = Array.isArray(body)
      ? body
      : body?.milestones || body?.data || []

    const sanitized = sanitizeMilestones(rawList)
    const doc = {
      id: DOC_ID,
      handle: PARTITION_KEY,
      type: 'milestones',
      milestones: sanitized,
      updatedAt: new Date().toISOString(),
    }

    if (container) {
      try {
        const { resource } = await container.items.upsert(doc)
        sendJson(context, 200, {
          success: true,
          count: sanitized.length,
          data: resource.milestones || sanitized,
          source: 'azure-cosmos-db',
        })
        return
      } catch (err) {
        context.log.error('Cosmos DB milestones update error:', err)
      }
    }

    sendJson(context, 200, { success: true, count: sanitized.length, data: sanitized, source: 'in-memory' })
    return
  }

  sendJson(context, 405, { success: false, message: 'Method Not Allowed' })
}
