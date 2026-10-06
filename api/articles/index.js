const { getCosmosContainer } = require('../shared/cosmosClient')
const { verifyAuth, sendJson } = require('../shared/auth')

function sanitizeUrl(raw) {
  if (!raw) return ''
  const trimmed = String(raw).trim()
  if (/^(javascript|vbscript|data):/i.test(trimmed)) return ''
  return trimmed
}

module.exports = async function (context, req) {
  const container = await getCosmosContainer('articles', '/id')
  const verificationsContainer = await getCosmosContainer('verifications', '/handle')

  // 1. GET: 전체 글 목록 조회 (공개 API)
  if (req.method === 'GET') {
    if (container) {
      try {
        const { resources } = await container.items
          .query({
            query: "SELECT * FROM c WHERE NOT IS_DEFINED(c.type) OR c.type = 'article'",
          })
          .fetchAll()
        sendJson(context, 200, { success: true, count: resources.length, data: resources, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB articles read error:', err)
      }
    }
    sendJson(context, 200, { success: true, count: 0, data: [], source: 'fallback' })
    return
  }

  // 2. POST: 글 생성 또는 업데이트 ([보안] 작성자 본인 또는 관리자만 가능)
  if (req.method === 'POST') {
    const auth = verifyAuth(req)
    if (!auth.valid) {
      sendJson(context, 401, { success: false, message: '게시글을 작성하거나 수정하려면 먼저 로그인해 주세요.' })
      return
    }

    let article = req.body
    if (typeof article === 'string') {
      try {
        article = JSON.parse(article)
      } catch (e) {
        article = {}
      }
    }

    if (!article || !article.id) {
      sendJson(context, 400, { success: false, message: '글 id는 필수입니다.' })
      return
    }

    // 초기 목업 및 테스트 글 자동 재등록 차단
    const blockedMockIds = new Set(['art-1', 'art-2', 'art-3', 'art-4', 'art-5', 'art-6', 'art-1789899483060'])
    if (blockedMockIds.has(article.id)) {
      sendJson(context, 200, { success: true, message: 'Mock article ignored.', source: 'filter' })
      return
    }

    // 기존 글 수정 시 작성자 권한 검증
    if (container) {
      try {
        const existingRes = await container.item(article.id, article.id).read().catch(() => null)
        const existing = existingRes?.resource
        if (existing) {
          const isAuthor = existing.authorHandle && existing.authorHandle.toLowerCase() === auth.handle
          if (!isAuthor && !auth.isAdmin) {
            sendJson(context, 403, { success: false, message: '본인이 작성한 글만 수정할 수 있습니다.' })
            return
          }
        }
      } catch (_) {}
    }

    const doc = {
      ...article,
      id: article.id,
      handle: '__articles',
      type: 'article',
      url: sanitizeUrl(article.url),
      learnUrl: sanitizeUrl(article.learnUrl),
      authorHandle: auth.isAdmin ? (article.authorHandle || 'LIT') : auth.handle,
      updatedAt: new Date().toISOString(),
    }

    if (container) {
      try {
        const { resource } = await container.items.upsert(doc)

        // 아티클 생성 및 수정 감사 로그 기록
        const upsertAuditDoc = {
          id: `audit_art_${Date.now()}_${article.id}`,
          handle: '__audit',
          type: 'audit_log',
          action: 'ARTICLE_UPSERT',
          targetId: article.id,
          targetTitle: article.title || '',
          targetAuthor: doc.authorHandle,
          operator: auth.isAdmin ? 'LIT 운영진(Admin)' : `@${auth.handle}`,
          summaryKorean: `아티클 저장/수정 [${article.title || article.id}]`,
          createdAt: new Date().toISOString(),
        }
        if (verificationsContainer) {
          await verificationsContainer.items.upsert(upsertAuditDoc).catch(() => {})
        }

        sendJson(context, 200, { success: true, article: resource, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB articles upsert error:', err)
      }
    }

    sendJson(context, 200, { success: true, article: doc, source: 'fallback' })
    return
  }

  // 3. DELETE: 글 삭제 ([보안] 작성자 본인 또는 관리자만 가능)
  if (req.method === 'DELETE') {
    const auth = verifyAuth(req)
    if (!auth.valid) {
      sendJson(context, 401, { success: false, message: '게시글 삭제는 로그인 후 가능합니다.' })
      return
    }

    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {
        body = {}
      }
    }

    const id = req.query?.id || (body && body.id)
    if (!id) {
      sendJson(context, 400, { success: false, message: '삭제할 글 id를 지정해주세요.' })
      return
    }

    if (container) {
      try {
        // 기존 글 조회하여 작성자 일치 확인
        const existingRes = await container.item(id, id).read().catch(() => null)
        const existing = existingRes?.resource
        if (existing) {
          const isAuthor = existing.authorHandle && existing.authorHandle.toLowerCase() === auth.handle
          if (!isAuthor && !auth.isAdmin) {
            sendJson(context, 403, { success: false, message: '본인이 작성한 글만 삭제할 수 있습니다.' })
            return
          }
        }

        await container.item(id, id).delete()

        // 감사 로그 기록
        const deleteAuditDoc = {
          id: `audit_del_${Date.now()}_${id}`,
          handle: '__audit',
          type: 'audit_log',
          action: 'ARTICLE_DELETE',
          targetId: id,
          operator: auth.isAdmin ? 'LIT 운영진(Admin)' : `@${auth.handle}`,
          summaryKorean: `아티클 삭제 (${id})`,
          createdAt: new Date().toISOString(),
        }
        if (verificationsContainer) {
          await verificationsContainer.items.upsert(deleteAuditDoc).catch(() => {})
        }

        sendJson(context, 200, { success: true, message: `${id} 글이 삭제되었습니다.`, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB articles delete error:', err)
        if (err.code === 404) {
          sendJson(context, 200, { success: true, message: `${id} 글이 이미 삭제되었습니다.`, source: 'azure-cosmos-db' })
          return
        }
      }
    }

    sendJson(context, 200, { success: true, message: `${id} 글이 삭제되었습니다.`, source: 'fallback' })
    return
  }

  sendJson(context, 405, { success: false, message: 'Method Not Allowed' })
}
