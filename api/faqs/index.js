const { getCosmosContainer } = require('../shared/cosmosClient')
const { verifyAuth, sendJson } = require('../shared/auth')

const PARTITION_KEY = '__faqs'

module.exports = async function (context, req) {
  const container = await getCosmosContainer('faqs', '/id')
  const verificationsContainer = await getCosmosContainer('verifications', '/handle')

  // 1. GET: 전체 FAQ 목록 조회
  if (req.method === 'GET') {
    if (container) {
      try {
        const { resources } = await container.items
          .query({
            query: "SELECT * FROM c WHERE NOT IS_DEFINED(c.type) OR c.type = 'faq'",
          })
          .fetchAll()
        sendJson(context, 200, { success: true, count: resources.length, data: resources, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB faqs read error:', err)
      }
    }
    sendJson(context, 200, { success: true, count: 0, data: [], source: 'fallback' })
    return
  }

  // 2. POST: FAQ 생성 또는 업데이트 ([보안] 운영진 관리자 전용 권한)
  if (req.method === 'POST') {
    const auth = verifyAuth(req)
    if (!auth.valid || !auth.isAdmin) {
      sendJson(context, 403, { success: false, message: 'FAQ 등록 및 수정은 LIT 운영진 관리자 권한이 필요합니다.' })
      return
    }

    let faq = req.body
    if (typeof faq === 'string') {
      try {
        faq = JSON.parse(faq)
      } catch (e) {
        faq = {}
      }
    }
    if (!faq || !faq.id) {
      sendJson(context, 400, { success: false, message: 'FAQ id는 필수입니다.' })
      return
    }

    const doc = {
      ...faq,
      id: faq.id,
      handle: PARTITION_KEY,
      type: 'faq',
      updatedAt: new Date().toISOString(),
    }

    if (container) {
      try {
        const { resource } = await container.items.upsert(doc)

        // FAQ 생성 및 수정 감사 로그 기록 (verifications 컨테이너에 저장)
        const upsertFaqAuditDoc = {
          id: `audit_faq_${Date.now()}_${faq.id}`,
          handle: '__audit',
          type: 'audit_log',
          action: 'FAQ_UPSERT',
          targetId: faq.id,
          operator: 'LIT 운영진',
          summaryKorean: `FAQ 저장/수정 [${faq.q ? faq.q.slice(0, 30) : faq.id}]`,
          createdAt: new Date().toISOString(),
        }
        if (verificationsContainer) {
          await verificationsContainer.items.upsert(upsertFaqAuditDoc).catch(() => {})
        }

        sendJson(context, 200, { success: true, faq: resource, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB faqs upsert error:', err)
      }
    }

    sendJson(context, 200, { success: true, faq: doc, source: 'fallback' })
    return
  }

  // 3. DELETE: FAQ 삭제 ([보안] 운영진 관리자 전용 권한)
  if (req.method === 'DELETE') {
    const auth = verifyAuth(req)
    if (!auth.valid || !auth.isAdmin) {
      sendJson(context, 403, { success: false, message: 'FAQ 삭제는 LIT 운영진 관리자 권한이 필요합니다.' })
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
      sendJson(context, 400, { success: false, message: '삭제할 FAQ id를 지정해주세요.' })
      return
    }

    if (container) {
      try {
        await container.item(id, id).delete()

        // FAQ 삭제 감사 로그 기록
        const deleteFaqAuditDoc = {
          id: `audit_del_faq_${Date.now()}_${id}`,
          handle: '__audit',
          type: 'audit_log',
          action: 'FAQ_DELETE',
          targetId: id,
          operator: 'LIT 운영진',
          summaryKorean: `FAQ 삭제 (${id})`,
          createdAt: new Date().toISOString(),
        }
        if (verificationsContainer) {
          await verificationsContainer.items.upsert(deleteFaqAuditDoc).catch(() => {})
        }

        sendJson(context, 200, { success: true, message: `${id} FAQ가 삭제되었습니다.`, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB faqs delete error:', err)
        if (err.code === 404) {
          sendJson(context, 200, { success: true, message: `${id} FAQ가 이미 삭제되었습니다.`, source: 'azure-cosmos-db' })
          return
        }
      }
    }

    sendJson(context, 200, { success: true, message: `${id} FAQ가 삭제되었습니다.`, source: 'fallback' })
    return
  }

  sendJson(context, 405, { success: false, message: 'Method Not Allowed' })
}
