const { getCosmosContainer, getInMemoryStore } = require('../shared/cosmosClient')
const { verifyAuth, sendJson } = require('../shared/auth')

module.exports = async function (context, req) {
  const container = await getCosmosContainer('verifications', '/handle')
  const inMemory = getInMemoryStore()

  // 1. POST: 검증 기록 영구 저장 ([보안] 본인 계정 또는 관리자 권한 필수)
  if (req.method === 'POST') {
    const auth = verifyAuth(req)
    if (!auth.valid) {
      sendJson(context, 401, { success: false, message: '인증 로그 저장은 로그인이 필요합니다.' })
      return
    }

    let rec = req.body
    if (typeof rec === 'string') {
      try {
        rec = JSON.parse(rec)
      } catch (_) {
        rec = {}
      }
    }

    if (!rec || !rec.id || !rec.handle) {
      sendJson(context, 400, { success: false, message: 'id, handle은 필수입니다.' })
      return
    }

    const targetHandle = String(rec.handle).trim().toLowerCase()
    if (auth.handle !== targetHandle && !auth.isAdmin) {
      sendJson(context, 403, { success: false, message: '본인의 계정 로그만 저장할 수 있습니다.' })
      return
    }

    const doc = {
      ...rec,
      handle: targetHandle,
      type: rec.type || 'verification',
      savedAt: new Date().toISOString(),
    }
    // [보안] 민감 정보 저장 방지
    delete doc.password

    if (container) {
      try {
        await container.items.upsert(doc)
        sendJson(context, 200, { success: true, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.warn('Cosmos DB verification save warning:', err.message)
      }
    }
    if (!inMemory.verifications) inMemory.verifications = []
    inMemory.verifications.unshift(doc)
    sendJson(context, 200, { success: true, source: 'in-memory' })
    return
  }

  // 2. GET: 검증 감사 로그 목록 조회
  if (container) {
    try {
      const querySpec = {
        query: 'SELECT * FROM c ORDER BY c.createdAt DESC',
      }
      const { resources } = await container.items.query(querySpec).fetchAll()
      const sanitized = resources
        .filter((r) => r.type !== 'rate_limit') // 속도 제한 내부 레코드 노출 제외
        .map((r) => {
          const safe = { ...r }
          delete safe.password
          return safe
        })

      sendJson(context, 200, {
        success: true,
        count: sanitized.length,
        data: sanitized,
        source: 'azure-cosmos-db',
      })
      return
    } catch (err) {
      context.log.warn('Cosmos DB verifications query warning:', err.message)
    }
  }

  // Fallback in-memory
  const list = (inMemory.verifications || [])
    .filter((r) => r.type !== 'rate_limit')
    .map((r) => {
      const safe = { ...r }
      delete safe.password
      return safe
    })

  sendJson(context, 200, {
    success: true,
    count: list.length,
    data: list,
    source: 'in-memory',
  })
}
