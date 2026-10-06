const { getCosmosContainer, getInMemoryStore } = require('../shared/cosmosClient')
const {
  createSessionToken,
  hashPassword,
  getAdminSecret,
  sendJson,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempt,
} = require('../shared/auth')

const ADMIN_MEMBER = {
  id: 'LIT',
  handle: 'LIT',
  name: 'LIT 운영진',
  role: 'LIT 총괄 운영진',
  major: '경북대학교 IT대학',
  bio: 'LIT 운영진 공식 관리 계정입니다.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  clicks: 0,
  target: 250,
  badges: ['MSA 달성', '200 달성', '100 달성', '50 달성'],
  socials: {},
  type: 'member',
}

function getClientIdentifier(req, handle) {
  const ip = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'unknown_ip'
  const primaryIp = String(ip).split(',')[0].trim()
  return `${primaryIp}_${String(handle || '').toLowerCase()}`
}

module.exports = async function (context, req) {
  if (req.method !== 'POST') {
    sendJson(context, 405, { success: false, message: 'Method Not Allowed' })
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

  const { handle, password } = body || {}
  const cleanHandle = String(handle || '').trim()
  const inputPw = String(password || '').trim()

  if (!cleanHandle) {
    sendJson(context, 400, { success: false, message: '아이디를 입력해 주세요.' })
    return
  }
  if (!inputPw) {
    sendJson(context, 400, { success: false, message: '비밀번호(학번)를 입력해 주세요.' })
    return
  }

  const verificationsContainer = await getCosmosContainer('verifications', '/handle')
  const clientId = getClientIdentifier(req, cleanHandle)

  // 1. 분산 무차별 대입(Brute-Force) 방어 검사 (최대 5회 실패 시 5분 차단)
  const rateLimit = await checkRateLimit(clientId, 5, 5 * 60 * 1000, verificationsContainer)
  if (rateLimit.blocked) {
    sendJson(context, 429, {
      success: false,
      message: `보안을 위해 계정이 일시 보호 중입니다. ${rateLimit.remainSec}초 후에 다시 시도해 주세요.`,
    })
    return
  }

  // 2. LIT 운영진 관리자 로그인 검증 (클라우드 환경변수 ADMIN_PASSWORD 활용)
  if (cleanHandle.toUpperCase() === 'LIT') {
    const adminSecret = getAdminSecret()
    if (inputPw === adminSecret) {
      await clearFailedAttempt(clientId, verificationsContainer)
      const token = createSessionToken('LIT', true)
      sendJson(context, 200, {
        success: true,
        isAdmin: true,
        member: ADMIN_MEMBER,
        token,
      })
      return
    }

    await recordFailedAttempt(clientId, 5 * 60 * 1000, verificationsContainer)
    sendJson(context, 200, { success: false, message: '운영진 비밀번호가 일치하지 않습니다.' })
    return
  }

  // 3. 일반 부원 로그인 검증
  const container = await getCosmosContainer('members', '/handle')
  const inMemory = getInMemoryStore()
  let member = null

  if (container) {
    try {
      const itemRes = await container.item(cleanHandle.toLowerCase(), cleanHandle.toLowerCase()).read().catch(() => null)
      member = itemRes?.resource
    } catch (e) {
      context.log.warn('Cosmos DB login read warning:', e.message)
    }
  }

  if (!member) {
    member = inMemory.members.find((m) => m.handle?.toLowerCase() === cleanHandle.toLowerCase())
  }

  if (!member) {
    await recordFailedAttempt(clientId, 5 * 60 * 1000, verificationsContainer)
    sendJson(context, 200, { success: false, message: '등록되지 않은 아이디입니다.' })
    return
  }

  const storedPw = String(member.password || '').trim()
  const inputHash = hashPassword(inputPw)

  // 평문 학번 또는 SHA-256 해시값 모두 매칭 지원
  const isMatch = storedPw === inputPw || storedPw === inputHash

  if (!isMatch) {
    await recordFailedAttempt(clientId, 5 * 60 * 1000, verificationsContainer)
    sendJson(context, 200, { success: false, message: '학번이 일치하지 않습니다.' })
    return
  }

  // 로그인 성공 시 무차별 대입 기록 초기화
  await clearFailedAttempt(clientId, verificationsContainer)

  // 기존 평문 비밀번호인 경우 백그라운드에서 보안 해시값으로 자동 업그레이드
  if (storedPw === inputPw && storedPw !== inputHash && container) {
    container.items
      .upsert({ ...member, password: inputHash, updatedAt: new Date().toISOString() })
      .catch((e) => context.log.warn('Auto hash upgrade warning:', e.message))
  }

  // 비밀번호 필드를 완전히 제거한 안전한 멤버 객체 및 세션 토큰 반환
  const safeMember = { ...member }
  delete safeMember.password

  const token = createSessionToken(safeMember.handle, false)

  sendJson(context, 200, {
    success: true,
    isAdmin: false,
    member: safeMember,
    token,
  })
}
