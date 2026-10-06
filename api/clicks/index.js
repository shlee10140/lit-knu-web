const { getCosmosContainer, getInMemoryStore } = require('../shared/cosmosClient')
const { verifyAuth, sendJson } = require('../shared/auth')

module.exports = async function (context, req) {
  const container = await getCosmosContainer('members', '/handle')
  const verificationsContainer = await getCosmosContainer('verifications', '/handle')
  const inMemory = getInMemoryStore()
  const auth = verifyAuth(req)

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch (_) {
      body = {}
    }
  }

  // 1. 모든 부원 클릭수 일괄 초기화 ([보안] 운영진 관리자 전용 권한)
  if (body?.resetAll) {
    if (!auth.valid || !auth.isAdmin) {
      sendJson(context, 403, { success: false, message: '전체 클릭수 초기화는 LIT 운영진 관리자 권한이 필요합니다.' })
      return
    }

    const operator = body?.operator || '운영진 전체 클릭수 초기화'
    if (container) {
      try {
        const { resources } = await container.items.query('SELECT * FROM c').fetchAll()
        const memberDocs = resources.filter((r) => (!r.type || r.type === 'member'))
        const updatedHandles = []

        for (const m of memberDocs) {
          const docToSave = {
            ...m,
            clicks: 0,
            badges: [],
            updatedAt: new Date().toISOString(),
          }
          await container.items.upsert(docToSave)
          updatedHandles.push(m.handle || m.id)
        }

        const auditDoc = {
          id: `audit_reset_all_${Date.now()}`,
          handle: '__admin',
          type: 'verification',
          category: 'click_reset_all',
          memberName: '전체 부원',
          operator,
          summaryKorean: `모든 부원 클릭수 0으로 초기화 (${updatedHandles.length}명)`,
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
        }
        if (verificationsContainer) {
          await verificationsContainer.items.upsert(auditDoc).catch((e) => context.log.warn('Audit record warning:', e.message))
        }

        sendJson(context, 200, {
          success: true,
          message: `모든 부원(${updatedHandles.length}명)의 클릭수가 Azure DB에서 0으로 초기화되었습니다.`,
          count: updatedHandles.length,
          source: 'azure-cosmos-db',
        })
        return
      } catch (err) {
        context.log.error('Cosmos DB reset all error:', err)
      }
    }

    // In-memory fallback
    for (const m of inMemory.members) {
      m.clicks = 0
      m.badges = []
      m.updatedAt = new Date().toISOString()
    }
    sendJson(context, 200, {
      success: true,
      message: '메모리 저장소의 모든 부원 클릭수가 0으로 초기화되었습니다.',
      count: inMemory.members.length,
      source: 'in-memory',
    })
    return
  }

  // 2. 개별 부원 클릭수 조정
  const { handle: rawHandle, amount, isAbsolute, operator } = body || {}
  const handle = String(rawHandle || '').trim().toLowerCase()
  if (!handle) {
    sendJson(context, 400, { success: false, message: '부원 handle은 필수입니다.' })
    return
  }

  // 이전 버전 클라이언트 브라우저 캐시에서 자동으로 덮어쓰려 하는 레거시 요청은 차단 (서버 DB가 최우선 기준)
  if (operator === '클라이언트 동기화 자동 보정') {
    sendJson(context, 200, { success: false, message: '클라이언트 자동 보정은 비활성화되었습니다. 서버 DB가 최우선 기준입니다.' })
    return
  }

  // [보안] 클릭수 무단 조작 방지
  // 반드시 인증된 본인 계정 토큰(auth.handle === handle)이거나, 운영진 관리자 토큰이어야 클릭수 갱신 허용
  const isOwner = auth.valid && auth.handle === handle
  const isAdmin = auth.valid && auth.isAdmin

  if (!isOwner && !isAdmin) {
    sendJson(context, 403, {
      success: false,
      message: '본인의 클릭수만 조정할 수 있습니다. 먼저 로그인해 주세요.',
    })
    return
  }

  const delta = Number(amount) || 0

  if (container) {
    try {
      const itemResponse = await container.item(handle, handle).read().catch(() => null)
      const current = itemResponse?.resource
      const nextClicks = isAbsolute ? Math.max(0, delta) : Math.max(0, (Number(current?.clicks) || 0) + delta)

      const docToSave = {
        ...(current || { id: handle, handle }),
        type: 'member',
        clicks: nextClicks,
        updatedAt: new Date().toISOString(),
      }

      const { resource: updated } = await container.items.upsert(docToSave)

      // Cosmos DB 감사 로그 영구 보존
      const prevClicks = Number(current?.clicks) || 0
      const diff = nextClicks - prevClicks
      const auditDoc = {
        id: `audit_${Date.now()}_${handle}`,
        handle,
        type: 'verification',
        category: 'click_adjustment',
        memberName: current?.name || handle,
        operator: operator || (isAdmin ? 'LIT 운영진 직접 조정' : `@${handle}`),
        previousClicks: prevClicks,
        verifiedClicks: nextClicks,
        delta: diff,
        summaryKorean: `클릭수 조정 (${prevClicks} ➔ ${nextClicks}, ${diff >= 0 ? '+' : ''}${diff})`,
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
      }
      if (verificationsContainer) {
        await verificationsContainer.items.upsert(auditDoc).catch((e) => context.log.warn('Audit record warning:', e.message))
      }

      const safeMember = { ...updated }
      delete safeMember.password

      sendJson(context, 200, { success: true, member: safeMember, source: 'azure-cosmos-db' })
      return
    } catch (err) {
      context.log.warn('Cosmos DB atomic clicks error:', err.message)
    }
  }

  // In-memory fallback
  const member = inMemory.members.find((m) => m.handle === handle)
  if (member) {
    const nextClicks = isAbsolute ? Math.max(0, delta) : Math.max(0, (Number(member.clicks) || 0) + delta)
    member.clicks = nextClicks
    member.updatedAt = new Date().toISOString()
    const safeMem = { ...member }
    delete safeMem.password
    sendJson(context, 200, { success: true, member: safeMem, source: 'in-memory' })
    return
  }

  sendJson(context, 200, { success: true, clicks: delta })
}
