const { getCosmosContainer, getInMemoryStore } = require('../shared/cosmosClient')
const { verifyAuth, createSessionToken, hashPassword, sendJson } = require('../shared/auth')

const RESERVED_HANDLES = new Set([
  'lit', 'admin', 'administrator', 'root', 'system', 'operator', 'manager', 'audit', 'help', 'api',
  'shlee', 'minji_kim', 'junho_park', 'sujin_choi', 'dohyun_lee', 'chaewon_yoon', 'taeyang_jung', 'yejin_han', 'sanjun', 'aa'
])

module.exports = async function (context, req) {
  const container = await getCosmosContainer('members', '/handle')
  const verificationsContainer = await getCosmosContainer('verifications', '/handle')
  const inMemory = getInMemoryStore()

  // 1. GET: 부원 전체 목록 조회 (공개 API, 보안: password 필드 완전 제거)
  if (req.method === 'GET') {
    if (container) {
      try {
        const { resources } = await container.items.query('SELECT * FROM c').fetchAll()
        const members = resources
          .filter((r) => {
            if (r.type && r.type !== 'member') return false
            const h = String(r.handle || r.id || '').trim().toLowerCase()
            if (RESERVED_HANDLES.has(h) || r.name === '이승환') return false
            return true
          })
          .map((m) => {
            const safe = { ...m }
            delete safe.password
            return safe
          })

        sendJson(context, 200, { success: true, count: members.length, data: members, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB read error:', err)
      }
    }

    // Fallback store
    const fbMembers = inMemory.members
      .filter((r) => {
        const h = String(r.handle || r.id || '').trim().toLowerCase()
        return !RESERVED_HANDLES.has(h) && r.name !== '이승환'
      })
      .map((m) => {
        const safe = { ...m }
        delete safe.password
        return safe
      })

    sendJson(context, 200, { success: true, count: fbMembers.length, data: fbMembers, source: 'in-memory' })
    return
  }

  // 2. POST: 부원 생성(회원가입) 또는 프로필 업데이트
  if (req.method === 'POST') {
    let member = req.body
    if (typeof member === 'string') {
      try {
        member = JSON.parse(member)
      } catch (e) {
        member = {}
      }
    }

    const rawHandle = member && (member.handle || member.id)
    const handle = String(rawHandle || '').trim().toLowerCase()
    if (!handle) {
      sendJson(context, 400, { success: false, message: '부원 아이디(handle)는 필수입니다.' })
      return
    }

    if (RESERVED_HANDLES.has(handle) || member.name === '이승환') {
      sendJson(context, 400, { success: false, message: '사용할 수 없는 예약된 아이디입니다.' })
      return
    }

    // 기존 부원 존재 여부 확인 (계정 탈취 / 무단 덮어쓰기 방지)
    let existingDoc = null
    if (container) {
      try {
        const existingRes = await container.item(handle, handle).read().catch(() => null)
        existingDoc = existingRes?.resource || null
      } catch (_) {}
    }
    if (!existingDoc) {
      existingDoc = inMemory.members.find((m) => m.handle === handle) || null
    }

    const auth = verifyAuth(req)
    const isOwner = auth.valid && auth.handle === handle
    const isAdmin = auth.valid && auth.isAdmin

    // [보안] 기존 계정이 존재하는 경우 본인 또는 관리자만 수정 가능
    if (existingDoc) {
      if (!isOwner && !isAdmin) {
        // 토큰이 없는 경우 기존 비밀번호를 전달한 경우에 한해 수정 허용
        const providedPw = member.password && String(member.password).trim()
        const storedPw = existingDoc.password
        const pwMatch = providedPw && (storedPw === providedPw || storedPw === hashPassword(providedPw))
        if (!pwMatch) {
          sendJson(context, 403, {
            success: false,
            message: '이미 존재하는 부원 아이디입니다. 본인 프로필 수정을 위해 먼저 로그인해 주세요.',
          })
          return
        }
      }
    }

    // [보안] 비밀번호 해시 처리
    let finalPassword = existingDoc?.password
    if (member.password && String(member.password).trim()) {
      const p = String(member.password).trim()
      if (p.length < 4 && !existingDoc) {
        sendJson(context, 400, { success: false, message: '비밀번호는 최소 4자 이상이어야 합니다.' })
        return
      }
      finalPassword = p.length === 64 && /^[0-9a-f]{64}$/i.test(p) ? p : hashPassword(p)
    }

    // [보안] 클릭수 조작 방지 (리더보드 치팅 차단)
    // - 신규 가입 시 클릭수는 무조건 0으로 강제
    // - 기존 부원 프로필 수정 시 관리자가 아닌 경우 기존 DB의 검증된 클릭수 보존
    let finalClicks = 0
    if (existingDoc) {
      finalClicks = isAdmin && typeof member.clicks === 'number' ? member.clicks : Number(existingDoc.clicks) || 0
    }

    const doc = {
      ...member,
      handle,
      id: handle,
      type: 'member',
      clicks: finalClicks,
      ...(finalPassword ? { password: finalPassword } : {}),
      updatedAt: new Date().toISOString(),
    }

    // 신규 부원 가입 시 발급할 세션 토큰
    const token = createSessionToken(handle, false)

    if (container) {
      try {
        const { resource } = await container.items.upsert(doc)

        // 감사 로그 기록
        const upsertMemberAuditDoc = {
          id: `audit_member_${Date.now()}_${handle}`,
          handle: '__audit',
          type: 'audit_log',
          action: existingDoc ? 'MEMBER_UPDATE' : 'MEMBER_REGISTER',
          targetHandle: handle,
          targetName: member.name || handle,
          operator: auth.valid ? (isAdmin ? 'LIT 운영진(Admin)' : `@${auth.handle}`) : `@${handle}(신규가입)`,
          summaryKorean: existingDoc
            ? `부원 프로필 수정 (@${handle}, ${member.name || ''})`
            : `신규 부원 가입 완료 (@${handle}, ${member.name || ''})`,
          createdAt: new Date().toISOString(),
        }
        if (verificationsContainer) {
          await verificationsContainer.items.upsert(upsertMemberAuditDoc).catch(() => {})
        }

        const safeResource = { ...resource }
        delete safeResource.password

        sendJson(context, 200, { success: true, member: safeResource, token, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB upsert error:', err)
      }
    }

    const idx = inMemory.members.findIndex((m) => m.handle === handle)
    const safeDoc = { ...doc }
    delete safeDoc.password
    if (idx >= 0) {
      inMemory.members[idx] = doc
    } else {
      inMemory.members.push(doc)
    }

    sendJson(context, 200, { success: true, member: safeDoc, token, source: 'in-memory' })
    return
  }

  // 3. DELETE: 부원 삭제 ([보안] 운영진 관리자 전용 권한)
  if (req.method === 'DELETE') {
    const auth = verifyAuth(req)
    if (!auth.valid || !auth.isAdmin) {
      sendJson(context, 403, { success: false, message: '부원 삭제는 LIT 운영진 관리자 권한이 필요합니다.' })
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

    const rawHandle = req.query?.handle || (body && body.handle)
    const handle = String(rawHandle || '').trim().toLowerCase()
    if (!handle) {
      sendJson(context, 400, { success: false, message: '삭제할 부원 handle을 지정해주세요.' })
      return
    }

    if (container) {
      try {
        await container.item(handle, handle).delete()

        // 부원 삭제 감사 로그 기록
        const deleteMemberAuditDoc = {
          id: `audit_del_member_${Date.now()}_${handle}`,
          handle: '__audit',
          type: 'audit_log',
          action: 'MEMBER_DELETE',
          targetHandle: handle,
          operator: 'LIT 운영진',
          summaryKorean: `부원 계정 삭제 (@${handle})`,
          createdAt: new Date().toISOString(),
        }
        if (verificationsContainer) {
          await verificationsContainer.items.upsert(deleteMemberAuditDoc).catch(() => {})
        }

        sendJson(context, 200, { success: true, message: `${handle} 부원이 Azure DB에서 삭제되었습니다.`, source: 'azure-cosmos-db' })
        return
      } catch (err) {
        context.log.error('Cosmos DB delete error:', err)
        if (err.code === 404) {
          sendJson(context, 200, { success: true, message: `${handle} 부원이 이미 삭제되었습니다.`, source: 'azure-cosmos-db' })
          return
        }
      }
    }

    inMemory.members = inMemory.members.filter((m) => m.handle !== handle)
    sendJson(context, 200, { success: true, message: `${handle} 부원이 삭제되었습니다.`, source: 'in-memory' })
    return
  }

  sendJson(context, 405, { success: false, message: 'Method Not Allowed' })
}
