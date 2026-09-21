// LIT x MSA 250 챌린지 데이터 및 스토리지 관리 서비스
// LocalStorage 기반 즉시 반응형 스토어 + Pub/Sub 이벤트 버스 탑재

const STORAGE_KEYS = {
  MEMBERS: 'lit_msa_members_prod',
  ARTICLES: 'lit_msa_articles_prod',
  MISSIONS: 'lit_msa_missions_prod',
  CURRENT_USER: 'lit_msa_current_user_prod',
  IS_ADMIN: 'lit_msa_is_admin_prod',
  FAQS: 'lit_msa_faqs_v1',
  MILESTONES: 'lit_msa_milestones_prod',
}

// 기본 마일스톤 및 리워드 정의 (Azure Cosmos DB와 실시간 동적 연동)
export const DEFAULT_MILESTONES = [
  { count: 30, title: '30 달성', icon: '🌱', badge: '30 달성', reward: '커피 기프티콘', color: 'mint' },
  { count: 50, title: '50 달성', icon: '🌿', badge: '50 달성', reward: '편의점 기프티콘', color: 'amber' },
  { count: 100, title: '100 달성', icon: '🪴', badge: '100 달성', reward: '케익 기프티콘', color: 'pink' },
  { count: 150, title: '150 달성', icon: '🌳', badge: '150 달성', reward: '치킨 기프티콘', color: 'orange' },
  { count: 200, title: '200 달성', icon: '🍎', badge: '200 달성', reward: '자격증 응시비 지원', color: 'violet' },
  { count: 250, title: '250 달성', icon: '👑', badge: '250 달성', reward: 'MSA 달성', color: 'gold' },
]

export const MILESTONES = DEFAULT_MILESTONES

export const createSolidColorAvatar = (hexColor) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='${encodeURIComponent(hexColor)}'/%3E%3C/svg%3E`

export const AVATAR_COLORS = [
  '#5EF0D6', // LIT Mint
  '#FF6FB1', // LIT Pink
  '#8B7BFF', // LIT Violet
  '#FFD166', // LIT Amber
  '#38BDF8', // Sky Blue
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F43F5E', // Coral
]

export const AVATAR_PRESETS = AVATAR_COLORS.map(createSolidColorAvatar)

// 이미지 압축 헬퍼 (모바일 고화질 사진도 240x240의 가벼운 썸네일로 압축하여 Cosmos DB와 LocalStorage에 초고속 저장)
export function compressImage(file, maxWidth = 240, quality = 0.8) {
  return new Promise((resolve) => {
    if (!file) return resolve('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height)
            height = maxWidth
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(e.target.result)
      img.src = e.target.result
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

// LIT 공식 관리자(운영진) 계정 정의
export const ADMIN_MEMBER = {
  id: 'admin-lit',
  handle: 'LIT',
  name: 'LIT 운영진',
  role: '운영진 (Admin)',
  major: 'LIT 운영국',
  contributorId: 'studentamb_482865',
  certifications: 'AI-900, AZ-900',
  clicks: 250,
  target: 250,
  msLink: 'https://learn.microsoft.com/?wt.mc_id=studentamb_482865',
  links: [
    { id: 'lit-1', title: 'LIT 공식 LinkedIn', url: 'https://linkedin.com/in/lit-knu' },
    { id: 'lit-2', title: 'LIT 기술 블로그', url: 'https://velog.io/@lit-official' },
    { id: 'lit-3', title: 'GitHub Organization', url: 'https://github.com/LITofficial' },
  ],
  socials: {
    linkedin: 'https://linkedin.com/in/lit-knu',
    blog: 'https://velog.io/@lit-official',
    github: 'https://github.com/LITofficial',
  },
  bio: '경북대학교 IT 기술 발표 동아리 LIT 공식 운영진 계정입니다.',
  password: 'lit2026!@',
  avatar: AVATAR_PRESETS[2], // LIT Violet (#8B7BFF)
  badges: ['30 달성', '50 달성', '100 달성', '150 달성', '200 달성', '250 달성'],
  isAdmin: true,
}

export function formatContributorLink(idOrUrl) {
  if (!idOrUrl) return 'https://learn.microsoft.com/?wt.mc_id=studentamb_482865'
  const trimmed = String(idOrUrl).trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  const cleanId = trimmed.replace(/^@/, '')
  const finalId = cleanId.startsWith('studentamb_') ? cleanId : `studentamb_${cleanId}`
  return `https://learn.microsoft.com/?wt.mc_id=${finalId}`
}

export function extractContributorId(idOrUrl) {
  if (!idOrUrl) return ''
  const trimmed = String(idOrUrl).trim()
  if (trimmed.includes('wt.mc_id=')) {
    const match = trimmed.match(/wt\.mc_id=([^&]+)/)
    if (match) return match[1]
  }
  if (!trimmed.startsWith('http')) {
    return trimmed
  }
  return trimmed
}

export function validateAndGenerateContributorUrl(originalUrl, contributorId) {
  if (!originalUrl || !String(originalUrl).trim()) {
    return { isValid: false, url: '', error: null }
  }

  let trimmed = String(originalUrl).trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed
  }

  let urlObj
  try {
    urlObj = new URL(trimmed)
  } catch (e) {
    return { isValid: false, url: '', error: '올바른 URL 형식(주소)을 입력해 주세요.' }
  }

  const hostname = urlObj.hostname.toLowerCase()

  // 1. 단축 URL 차단 (가이드 지침: Bitly 등 제3자 단축 URL 사용 금지)
  const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'rebrand.ly', 'rb.gy', 'goo.gl']
  if (shorteners.some((s) => hostname === s || hostname.endsWith('.' + s))) {
    return {
      isValid: false,
      url: '',
      error: 'Bitly 등 제3자 단축 URL은 방문자 추적이 누락되므로 사용할 수 없습니다. Microsoft 원본 URL을 입력해 주세요.',
    }
  }

  // 2. Microsoft 적격 도메인 검사
  const isMsDomain =
    hostname === 'microsoft.com' ||
    hostname.endsWith('.microsoft.com') ||
    hostname === 'code.visualstudio.com' ||
    hostname.endsWith('.visualstudio.com')
  if (!isMsDomain) {
    return {
      isValid: false,
      url: '',
      error: 'Microsoft 공식 도메인(learn.microsoft.com, azure.microsoft.com 등)의 링크만 지원됩니다.',
    }
  }

  // 3. 언어-지역 코드 제거 (/ko-kr/, /en-us/, /ja-jp/ 등)
  urlObj.pathname = urlObj.pathname.replace(/^\/([a-zA-Z]{2}-[a-zA-Z]{2,4}|en|ko|ja|de|fr|es|zh|pt)(\/|$)/i, '/')

  // 4. 홈페이지 메인(루트) 링크 차단 (가이드 지침: 홈페이지 링크 지양, 구체적인 콘텐츠 공유 필요)
  const cleanPath = urlObj.pathname.replace(/\/+$/, '')
  if (!cleanPath || cleanPath === '') {
    return {
      isValid: false,
      url: '',
      error: '홈페이지 메인 주소(루트)는 유입 카운트 대상이 아닙니다. 구체적인 모듈이나 상세 콘텐츠 링크를 입력해 주세요.',
    }
  }

  // 5. Microsoft Learn Plans(플랜) 차단 (가이드 지침: Learn Plans는 Community Influencer 카운트 불가)
  if (/\/(training\/)?plans(\/|$)/i.test(urlObj.pathname)) {
    return {
      isValid: false,
      url: '',
      error: 'Microsoft Learn Plans(플랜) 링크는 Community Influencer 카운트 대상이 아닙니다. 모듈 또는 학습 경로 링크를 사용하세요.',
    }
  }

  // 6. Contributor ID 포맷팅
  let cleanId = String(contributorId || '').trim()
  if (!cleanId) cleanId = 'studentamb_482865'
  cleanId = cleanId.replace(/^@/, '')
  const finalId = cleanId.startsWith('studentamb_') ? cleanId : `studentamb_${cleanId}`

  // 7. 기존 파라미터 보존 및 Contributor ID 연결
  // 가이드 지침: 기존 파라미터(?WT.mc_id=academic 등)는 유지하고 &wt.mc_id=studentamb_... 추가
  // 단, 기존에 이미 studentamb_ 파라미터가 있다면 본인 ID로 교체
  const params = Array.from(urlObj.searchParams.entries())
  urlObj.search = ''
  let replacedAmb = false
  for (const [k, v] of params) {
    if (k.toLowerCase() === 'wt.mc_id' && v.toLowerCase().startsWith('studentamb_')) {
      if (!replacedAmb) {
        urlObj.searchParams.append('wt.mc_id', finalId)
        replacedAmb = true
      }
    } else {
      urlObj.searchParams.append(k, v)
    }
  }
  if (!replacedAmb) {
    urlObj.searchParams.append('wt.mc_id', finalId)
  }

  return { isValid: true, url: urlObj.toString(), error: null }
}

export function generateContributorUrl(originalUrl, contributorId) {
  const res = validateAndGenerateContributorUrl(originalUrl, contributorId)
  return res.isValid ? res.url : ''
}

// 부원 데이터 초기값 (실제 운영용: 깨끗한 빈 목록)
export const DEFAULT_MEMBERS = []

// 아티클 데이터 초기값 (실제 운영용)
const DEFAULT_ARTICLES = []

// 공지사항 미션 초기 템플릿 (참여 내역 초기화)
const DEFAULT_MISSIONS = [
  {
    id: 'mis-1',
    title: '🎯 LinkedIn에 첫 기술 글 게시 & LIT 피드 공유',
    desc: 'Microsoft Learn에서 이번 주 학습한 모듈이나 세션 주제를 바탕으로 LinkedIn에 글을 작성하고, 본문에 본인의 챌린지 링크를 연결한 후 LIT 피드에 등록하세요.',
    reward: '☕ 스타벅스 커피 쿠폰 추첨 + 동아리 50P',
    deadline: '2026-09-27',
    completedMemberHandles: [],
    active: true,
  },
]

// 초기 FAQ 목업 데이터 (관리자 추가/수정/삭제 지원)
const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    q: 'MSA(Microsoft Student Ambassadors) 챌린지란 무엇인가요?',
    a: 'Microsoft가 전 세계 학생 리더들을 육성하는 공식 프로그램의 일환으로, 각 부원에게 부여된 Microsoft Learn 고유 추천 링크를 통해 250명의 클릭/참여를 달성하는 챌린지입니다. 배운 내용을 사람들에게 나누고 기술을 널리 알리는 Tech Evangelism 활동의 공식 증명이 됩니다.',
  },
  {
    id: 'faq-2',
    q: '내 고유 링크(250 클릭 링크)는 어떻게 만드나요?',
    a: 'Microsoft Learn 포털(learn.microsoft.com)에 로그인 후, Ambassador 프로필 또는 특정 모듈 링크 뒤에 본인의 고유 태그(?wt.mc_id=studentamb_XXXXXX)를 붙여 발급받습니다. 발급받은 링크를 본 웹사이트의 [내 프로필]에 등록해 두면 언제든 쉽게 복사하고 공유할 수 있습니다.',
  },
  {
    id: 'faq-3',
    q: '체크포인트(30, 50, 100, 150, 200, 250) 리워드는 어떻게 받나요?',
    a: '본인의 대시보드에서 클릭수를 업데이트하면 리더보드에 자동으로 뱃지가 부여됩니다. 30 클릭(커피 기프티콘), 50 클릭(편의점 기프티콘), 100 클릭(케익 기프티콘), 150 클릭(치킨 기프티콘), 200 클릭(자격증 응시비 지원), 250 클릭(MSA 달성) 시 운영진이 확인 후 리워드를 전달합니다.',
  },
  {
    id: 'faq-4',
    q: '내가 쓴 글 링크는 어떻게 공유하나요?',
    a: 'LinkedIn, Velog, Tistory, Medium 등에 학습 글을 기고한 뒤, 웹 상단의 [새 글 공유하기] 버튼을 눌러 링크와 간단한 설명을 등록하면 LIT 피드에 즉시 노출됩니다. 내 글의 공유 링크(?author=내아이디)를 친구나 SNS에 보내면 내가 쓴 글들이 최우선으로 노출되면서도 동아리 전체 글도 함께 탐색할 수 있습니다.',
  },
  {
    id: 'faq-5',
    q: 'MS 공인 자격증(AI-900, AZ-900 등)은 어떻게 등록하나요?',
    a: '내 프로필 수정 화면에서 보유한 Microsoft 공인 자격증(예: AI-900, AZ-900, DP-900 등)을 입력하시면 리더보드와 내 대시보드에 공식 인증 뱃지가 자동으로 표시됩니다.',
  },
]

// 레거시 가상 예시 계정 및 더미 데이터 자동 정리 함수
function purgeLegacyMockData() {
  if (typeof window === 'undefined') return
  try {
    const rawMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS)
    if (rawMembers) {
      const parsed = JSON.parse(rawMembers)
      const mockHandles = ['shlee', 'minji_kim', 'junho_park', 'sujin_choi', 'hyunjin_lee', 'daeun_jung', 'taeyang_kang', 'yuna_song']
      const hasMocks = parsed.some((m) => mockHandles.includes(m.handle) || m.name === '이승환')
      if (hasMocks) {
        const cleaned = parsed.filter((m) => !mockHandles.includes(m.handle) && m.name !== '이승환')
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(cleaned))
      }
    }
    const current = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    if (current && (current.toLowerCase() === 'shlee' || current === '이승환')) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    }
    const rawArticles = localStorage.getItem(STORAGE_KEYS.ARTICLES)
    if (rawArticles) {
      const parsed = JSON.parse(rawArticles)
      const mockArtIds = ['art-1', 'art-2', 'art-3', 'art-4']
      if (parsed.some((a) => mockArtIds.includes(a.id))) {
        localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify([]))
      }
    }
  } catch (e) {
    console.debug('Purge legacy mock data error:', e)
  }
}
purgeLegacyMockData()

// Pub/Sub 리스너 관리
const listeners = new Set()
function notify() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch (err) {
      console.error('Storage listener error:', err)
    }
  })
}

// Timeout fetch helper for resilient cloud sync
async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (err) {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Cloud Sync Helper with Azure Cosmos DB & Functions (각 데이터 타입 독립 동기화)
let isSyncing = false
export async function syncFromCloud() {
  if (isSyncing || typeof window === 'undefined') return
  isSyncing = true
  try {
    // 1. Members 독립 동기화
    const pMembers = (async () => {
      const res = await fetchWithTimeout('/api/members')
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        if (!json) return
        const cloudMembers = Array.isArray(json.data) ? json.data : Array.isArray(json.members) ? json.members : []
        const currentMilestones = storageService.getMilestones()
        const cleanedMembers = cloudMembers
          .filter((m) => m.handle !== 'shlee' && m.name !== '이승환')
          .map((m) => {
            const rawClicks = Number(m.clicks)
            const clicks = isNaN(rawClicks) ? 0 : Math.max(0, rawClicks)
            const contributorId = m.contributorId || extractContributorId(m.msLink) || 'studentamb_482865'
            const badges = currentMilestones.filter((ml) => clicks >= ml.count).map((ml) => ml.badge)
            let avatar = m.avatar
            if (!avatar || avatar.includes('unsplash.com') || avatar.includes('dicebear')) {
              const hash = (m.handle || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
              avatar = AVATAR_PRESETS[Math.abs(hash) % AVATAR_PRESETS.length]
            }
            return {
              ...m,
              handle: String(m.handle || m.id).toLowerCase(),
              clicks,
              avatar,
              role: (m.role || 'LIT 부원').replace(/MLSA/g, 'MSA'),
              contributorId,
              certifications: m.certifications || '',
              msLink: m.msLink || formatContributorLink(contributorId),
              password: m.password || '',
              badges,
            }
          })

        const currentLocalStr = localStorage.getItem(STORAGE_KEYS.MEMBERS)
        const newMembersStr = JSON.stringify(cleanedMembers)
        if (currentLocalStr !== newMembersStr) {
          localStorage.setItem(STORAGE_KEYS.MEMBERS, newMembersStr)
          notify()
        }

        const currentHandle = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
        if (currentHandle && currentHandle.toUpperCase() !== 'LIT') {
          const stillExists = cleanedMembers.some((cm) => cm.handle.toLowerCase() === currentHandle.toLowerCase())
          if (!stillExists) {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
            notify()
          }
        }
      }
    })()

    // 2. Articles 독립 동기화
    const pArticles = (async () => {
      const res = await fetchWithTimeout('/api/articles')
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        if (!json) return
        const cloudArticles = Array.isArray(json.data) ? json.data : []
        const cleaned = cloudArticles.map((a) => ({
          id: a.id,
          title: a.title || '',
          excerpt: a.excerpt || '',
          url: a.url || '',
          learnUrl: a.learnUrl || '',
          platform: a.platform || 'linkedin',
          authorHandle: a.authorHandle || '',
          authorName: a.authorName || '',
          authorAvatar: a.authorAvatar || '',
          tags: a.tags || [],
          likes: a.likes || 0,
          createdAt: a.createdAt || '',
        }))
        const localStr = localStorage.getItem(STORAGE_KEYS.ARTICLES)
        const newStr = JSON.stringify(cleaned)
        if (localStr !== newStr) {
          localStorage.setItem(STORAGE_KEYS.ARTICLES, newStr)
          notify()
        }
      }
    })()

    // 3. Missions 독립 동기화
    const pMissions = (async () => {
      const res = await fetchWithTimeout('/api/missions')
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        if (!json) return
        const cloudMissions = Array.isArray(json.data) ? json.data : []
        if (cloudMissions.length > 0) {
          const cleaned = cloudMissions.map((m) => ({
            id: m.id,
            title: (m.title || '')
              .replace(/\[주간 미션\]/g, '')
              .replace(/\[동료 피드백\]/g, '')
              .replace(/\[부스트 퀘스트\]/g, '')
              .replace(/\[마일스톤 챌린지\]/g, '')
              .replace(/\s+/g, ' ')
              .trim(),
            desc: m.desc || '',
            reward: m.reward || '',
            category: m.category || 'weekly',
            deadline: m.deadline || '',
            completedMemberHandles: m.completedMemberHandles || [],
            active: m.active !== undefined ? m.active : true,
          }))
          const localStr = localStorage.getItem(STORAGE_KEYS.MISSIONS)
          const newStr = JSON.stringify(cleaned)
          if (localStr !== newStr) {
            localStorage.setItem(STORAGE_KEYS.MISSIONS, newStr)
            notify()
          }
        }
      }
    })()

    // 4. FAQs 독립 동기화
    const pFaqs = (async () => {
      const res = await fetchWithTimeout('/api/faqs')
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        if (!json) return
        const cloudFaqs = Array.isArray(json.data) ? json.data : []
        if (cloudFaqs.length > 0) {
          const cleaned = cloudFaqs
            .filter((item) => !item.q?.includes('Azure 시스템으로 DB 관리'))
            .map((item, idx) => ({
              id: item.id || `faq-${idx + 1}`,
              q: item.q || '',
              a: item.a || '',
              createdAt: item.createdAt || '',
              updatedAt: item.updatedAt || '',
            }))
          const localStr = localStorage.getItem(STORAGE_KEYS.FAQS)
          const newStr = JSON.stringify(cleaned)
          if (localStr !== newStr) {
            localStorage.setItem(STORAGE_KEYS.FAQS, newStr)
            notify()
          }
        }
      }
    })()

    // 5. Milestones 독립 동기화 (조회수 기준, 보상 내용, 이모티콘 실시간 DB 연동)
    const pMilestones = (async () => {
      const res = await fetchWithTimeout('/api/milestones')
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        if (!json) return
        const cloudMilestones = Array.isArray(json.data) ? json.data : []
        if (cloudMilestones.length > 0) {
          const sorted = cloudMilestones
            .map((item) => {
              const rawCount = Number(item.count)
              const count = isNaN(rawCount) ? 0 : Math.max(0, rawCount)
              return {
                count,
                icon: String(item.icon || '🌱').trim(),
                reward: String(item.reward || '').trim(),
                title: item.title || `${count} 달성`,
                badge: item.badge || `${count} 달성`,
                color: item.color || (count >= 250 ? 'gold' : count >= 200 ? 'violet' : count >= 150 ? 'orange' : count >= 100 ? 'pink' : count >= 50 ? 'amber' : 'mint'),
              }
            })
            .sort((a, b) => a.count - b.count)

          const localStr = localStorage.getItem(STORAGE_KEYS.MILESTONES)
          const newStr = JSON.stringify(sorted)
          if (localStr !== newStr) {
            localStorage.setItem(STORAGE_KEYS.MILESTONES, newStr)
            notify()
          }
        }
      }
    })()

    await Promise.allSettled([pMembers, pArticles, pMissions, pFaqs, pMilestones])
  } catch (err) {
    console.debug('[Azure Sync] Local-first mode active:', err.message)
  } finally {
    isSyncing = false
  }
}

// 브라우저 환경에서 실시간 클라우드 자동 동기화 활성화 (즉시 1회 실행 + 3초 주기 폴링 + 포커스 반응)
if (typeof window !== 'undefined') {
  syncFromCloud()
  window.addEventListener('focus', () => syncFromCloud())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncFromCloud()
  })
  setInterval(syncFromCloud, 3000)
}

export const storageService = {
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  // 1. Members
  getMembers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS)
      if (data) {
        let list = JSON.parse(data)
        const legacyMockHandles = ['shlee', 'minji_kim', 'junho_park', 'sujin_choi', 'hyunjin_lee', 'daeun_jung', 'taeyang_kang', 'yuna_song']
        const hasLegacyMocks = list.some((m) => legacyMockHandles.includes(m.handle) || m.name === '이승환')
        if (hasLegacyMocks) {
          list = list.filter((m) => !legacyMockHandles.includes(m.handle) && m.name !== '이승환')
          localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(list))
        }
        const currentMilestones = this.getMilestones()
        return list.map((m) => {
          const rawClicks = Number(m.clicks)
          const clicks = isNaN(rawClicks) ? 0 : Math.max(0, rawClicks)
          const contributorId = m.contributorId || extractContributorId(m.msLink) || 'studentamb_482865'
          const badges = currentMilestones.filter((ml) => clicks >= ml.count).map((ml) => ml.badge)
          let avatar = m.avatar
          if (!avatar || avatar.includes('unsplash.com') || avatar.includes('dicebear')) {
            const hash = (m.handle || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
            avatar = AVATAR_PRESETS[Math.abs(hash) % AVATAR_PRESETS.length]
          }
          const memberClean = {
            ...m,
            clicks,
            avatar,
            role: (m.role || '').replace(/MLSA/g, 'MSA'),
            contributorId,
            certifications: m.certifications || '',
            msLink: m.msLink || formatContributorLink(contributorId),
            password: m.password || '1234',
            badges,
          }
          delete memberClean.generation
          return memberClean
        })
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e)
    }
    return []
  },

  getMember(handle) {
    if (!handle) return null
    const clean = String(handle).trim()
    if (clean.toUpperCase() === 'LIT') {
      try {
        const savedAdmin = localStorage.getItem('lit_admin_member_override')
        if (savedAdmin) {
          Object.assign(ADMIN_MEMBER, JSON.parse(savedAdmin))
        }
      } catch (e) {}
      return ADMIN_MEMBER
    }
    const members = this.getMembers()
    return members.find((m) => m.handle.toLowerCase() === clean.toLowerCase()) || null
  },

  // 권한 확인: 관리자이거나 현재 로그인한 본인 계정인지 검증
  checkEditPermission(targetHandle) {
    if (this.isAdmin()) return true
    const current = this.getCurrentUser()
    return current && current.handle.toLowerCase() === String(targetHandle).toLowerCase()
  },

  loginMember(handle, password) {
    const clean = String(handle || '').trim()

    // 1. LIT 운영진(관리자) 로그인 (아이디: LIT, 학번: lit2026!@)
    if (clean.toUpperCase() === 'LIT') {
      if (password !== 'lit2026!@') {
        return { success: false, message: '학번이 올바르지 않습니다. (운영진 인증 실패)' }
      }
      this.setAdmin(true)
      this.setCurrentUser('LIT')
      return { success: true, member: ADMIN_MEMBER, isAdmin: true }
    }

    // 2. 일반 부원 로그인
    const member = this.getMember(clean)
    if (!member) {
      return { success: false, message: '등록되지 않은 아이디입니다.' }
    }
    const memberPw = member.password || ''
    if (memberPw !== password) {
      return { success: false, message: '학번이 일치하지 않습니다.' }
    }
    this.setAdmin(false)
    this.setCurrentUser(member.handle)
    return { success: true, member, isAdmin: false }
  },

  async updateMemberClicks(handle, amount, isAbsolute = false) {
    if (!this.checkEditPermission(handle)) {
      alert('본인 계정의 클릭수만 수정할 수 있습니다. (관리자만 타인 계정 수정 가능)')
      return null
    }

    const clean = String(handle).trim()
    const delta = Number(amount) || 0

    const currentMilestones = this.getMilestones()
    if (clean.toUpperCase() === 'LIT') {
      const currentClicks = Math.max(0, Number(ADMIN_MEMBER.clicks) || 0)
      const nextClicks = isAbsolute ? Math.max(0, delta) : Math.max(0, currentClicks + delta)
      ADMIN_MEMBER.clicks = nextClicks
      ADMIN_MEMBER.badges = currentMilestones.filter((ml) => nextClicks >= ml.count).map((ml) => ml.badge)
      try {
        localStorage.setItem('lit_admin_member_override', JSON.stringify(ADMIN_MEMBER))
      } catch (e) {}
      notify()
      return ADMIN_MEMBER
    }

    const members = this.getMembers()
    const updated = members.map((m) => {
      if (m.handle.toLowerCase() === clean.toLowerCase()) {
        const currentClicks = Math.max(0, Number(m.clicks) || 0)
        const nextClicks = isAbsolute ? Math.max(0, delta) : Math.max(0, currentClicks + delta)
        const badges = currentMilestones.filter((ml) => nextClicks >= ml.count).map((ml) => ml.badge)
        return {
          ...m,
          clicks: nextClicks,
          badges,
        }
      }
      return m
    })
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated))
    notify()

    // Azure Cosmos DB로 클릭수 실시간 전송
    try {
      await fetch('/api/clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: clean, amount, isAbsolute }),
      })
    } catch (e) {
      console.debug('[Azure Sync] clicks error:', e)
    }

    return updated.find((m) => m.handle.toLowerCase() === clean.toLowerCase())
  },

  async updateMemberProfile(handle, partial) {
    if (!this.checkEditPermission(handle)) {
      alert('본인의 프로필만 수정할 수 있습니다. (관리자만 타인 계정 수정 가능)')
      return null
    }

    const sanitized = { ...partial }
    delete sanitized.generation
    if (sanitized.contributorId) {
      sanitized.contributorId = sanitized.contributorId.trim()
      sanitized.msLink = formatContributorLink(sanitized.contributorId)
    }

    const clean = String(handle).trim()
    if (clean.toUpperCase() === 'LIT') {
      Object.assign(ADMIN_MEMBER, sanitized)
      try {
        localStorage.setItem('lit_admin_member_override', JSON.stringify(ADMIN_MEMBER))
      } catch (e) {}
      notify()
      return ADMIN_MEMBER
    }

    const members = this.getMembers()
    const updated = members.map((m) => {
      if (m.handle.toLowerCase() === clean.toLowerCase()) {
        return { ...m, ...sanitized }
      }
      return m
    })
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated))
    notify()

    // Azure Cosmos DB로 프로필 변경사항 실시간 전송
    const savedMember = updated.find((m) => m.handle.toLowerCase() === clean.toLowerCase())
    if (savedMember) {
      try {
        const res = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedMember),
        })
        if (res.ok) {
          const resData = await res.json().catch(() => ({}))
          if (resData?.member) {
            const finalUpdated = this.getMembers().map((m) =>
              m.handle.toLowerCase() === clean.toLowerCase() ? { ...m, ...resData.member } : m
            )
            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(finalUpdated))
            notify()
          }
        }
      } catch (e) {
        console.debug('[Azure Sync] profile update error:', e)
      }
    }

    return savedMember
  },

  async addMember(newMember) {
    let cleanHandle = String(newMember.handle || '').trim().toLowerCase().replace(/\s+/g, '_')
    // 영문, 숫자, 밑줄, 하이픈 및 한글 문자 모두 허용
    cleanHandle = cleanHandle.replace(/[^a-z0-9_가-힣-]/g, '')
    if (!cleanHandle) {
      cleanHandle = 'user_' + Date.now().toString(36)
    }

    const members = this.getMembers()
    const existing = members.find((m) => m.handle.toLowerCase() === cleanHandle.toLowerCase())
    if (existing) {
      return await this.updateMemberProfile(cleanHandle, newMember)
    }

    const contributorId = (newMember.contributorId || extractContributorId(newMember.msLink) || '').trim()
    const msLink = formatContributorLink(contributorId || newMember.msLink)
    const memberObj = {
      id: cleanHandle,
      handle: cleanHandle,
      name: (newMember.name || '').trim() || 'LIT 부원',
      password: (newMember.password || '').trim(),
      role: (newMember.role || '').trim(),
      major: (newMember.major || '').trim(),
      certifications: (newMember.certifications || '').trim(),
      contributorId: contributorId || (msLink ? extractContributorId(msLink) : ''),
      clicks: Number(newMember.clicks) || 0,
      target: 250,
      msLink,
      socials: {
        linkedin: (newMember.linkedin || '').trim(),
        blog: (newMember.blog || '').trim(),
        github: (newMember.github || '').trim(),
      },
      links: Array.isArray(newMember.links) ? newMember.links : [],
      bio: (newMember.bio || '').trim(),
      avatar:
        newMember.avatar ||
        AVATAR_PRESETS[Math.abs(cleanHandle.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % AVATAR_PRESETS.length],
      badges: this.getMilestones().filter((ml) => (Number(newMember.clicks) || 0) >= ml.count).map((ml) => ml.badge),
    }

    members.push(memberObj)
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members))
    this.setCurrentUser(memberObj.handle)
    notify()

    // Azure Cosmos DB로 신규 부원 실시간 전송
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberObj),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.member) {
          const finalMembers = this.getMembers().map((m) =>
            m.handle.toLowerCase() === cleanHandle.toLowerCase() ? { ...m, ...data.member } : m
          )
          localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(finalMembers))
          notify()
        }
        syncFromCloud().catch(() => {})
      } else {
        const errJson = await res.json().catch(() => ({}))
        console.warn('[Azure Sync] addMember server error:', res.status, errJson)
        throw new Error(errJson.message || `서버 응답 오류 (${res.status})`)
      }
    } catch (e) {
      console.warn('[Azure Sync] addMember network error:', e)
      // 오프라인 상태이거나 네트워크 에러여도 로컬에는 저장되어 있으므로 이후 자동 동기화됨
    }

    return memberObj
  },

  async deleteMember(handle) {
    if (!this.isAdmin()) {
      alert('관리자만 부원을 삭제할 수 있습니다.')
      return false
    }
    const clean = String(handle).trim()
    if (clean.toUpperCase() === 'LIT') {
      alert('LIT 운영진 대표 계정은 삭제할 수 없습니다.')
      return false
    }
    const members = this.getMembers().filter((m) => m.handle.toLowerCase() !== clean.toLowerCase())
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members))
    const current = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    if (current && current.toLowerCase() === clean.toLowerCase()) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'LIT')
    }
    notify()

    // Azure Cosmos DB에서 부원 삭제 실시간 전송 후 즉시 클라우드 동기화
    try {
      await fetch(`/api/members?handle=${encodeURIComponent(clean)}`, {
        method: 'DELETE',
      })
      syncFromCloud().catch(() => {})
    } catch (e) {
      console.debug('[Azure Sync] deleteMember error:', e)
    }

    return true
  },

  // 2. Current User & Admin
  getCurrentUser() {
    const currentHandle = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    if (!currentHandle) {
      return null
    }
    if (String(currentHandle).toUpperCase() === 'LIT') {
      if (!this.isAdmin()) {
        localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'true')
      }
      return ADMIN_MEMBER
    }
    return this.getMember(currentHandle) || null
  },

  setCurrentUser(handle) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, handle)
    if (String(handle).toUpperCase() === 'LIT') {
      localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'true')
    }
    notify()
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    this.setAdmin(false)
    notify()
  },

  isAdmin() {
    const currentHandle = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    if (currentHandle && String(currentHandle).toUpperCase() === 'LIT') {
      return true
    }
    return localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true'
  },

  setAdmin(isAdmin) {
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, isAdmin ? 'true' : 'false')
    notify()
  },

  verifyAdminPasscode(code) {
    const valid = code === 'lit2026!@' || code === 'lit2026!' || code === '1234' || code === 'admin'
    if (valid) {
      this.setAdmin(true)
    }
    return valid
  },

  // 3. Articles
  getArticles() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ARTICLES)
      if (data) {
        let list = JSON.parse(data)
        const legacyArtIds = ['art-1', 'art-2', 'art-3', 'art-4']
        if (list.some((a) => legacyArtIds.includes(a.id))) {
          list = list.filter((a) => !legacyArtIds.includes(a.id))
          localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(list))
        }
        const members = this.getMembers()
        return list.map((art) => {
          let authorAvatar = art.authorAvatar
          if (!authorAvatar || authorAvatar.includes('unsplash.com') || authorAvatar.includes('dicebear')) {
            const author = members.find((m) => m.handle === art.authorHandle)
            authorAvatar = author?.avatar || AVATAR_PRESETS[0]
          }
          return { ...art, authorAvatar }
        })
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e)
    }
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(DEFAULT_ARTICLES))
    return DEFAULT_ARTICLES
  },

  async addArticle(article) {
    const articles = this.getArticles()
    const author = this.getMember(article.authorHandle) || this.getCurrentUser()
    const newArt = {
      id: `art-${Date.now()}`,
      title: article.title,
      excerpt: article.excerpt || '',
      url: article.url,
      learnUrl: article.learnUrl || '',
      platform: article.platform || 'linkedin',
      authorHandle: author?.handle || article.authorHandle || 'LIT',
      authorName: author?.name || article.authorName || 'LIT 부원',
      authorAvatar: author?.avatar || article.authorAvatar || AVATAR_PRESETS[0],
      tags: Array.isArray(article.tags)
        ? article.tags
        : (article.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      likes: 1,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    articles.unshift(newArt)
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles))
    notify()

    try {
      await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newArt, type: 'article', handle: '__articles' }),
      })
      syncFromCloud().catch(() => {})
    } catch (e) {
      console.warn('[Azure Sync] addArticle error:', e)
    }

    return newArt
  },

  async toggleArticleLike(articleId) {
    const articles = this.getArticles()
    let target = null
    const updated = articles.map((a) => {
      if (a.id === articleId) {
        target = { ...a, likes: (a.likes || 0) + 1 }
        return target
      }
      return a
    })
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updated))
    notify()

    if (target) {
      try {
        await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...target, type: 'article', handle: '__articles' }),
        })
      } catch (e) {
        console.warn('[Azure Sync] toggleArticleLike error:', e)
      }
    }
  },

  async deleteArticle(articleId) {
    const articles = this.getArticles().filter((a) => a.id !== articleId)
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles))
    notify()

    try {
      await fetch(`/api/articles?id=${encodeURIComponent(articleId)}`, {
        method: 'DELETE',
      })
      syncFromCloud().catch(() => {})
    } catch (e) {
      console.warn('[Azure Sync] deleteArticle error:', e)
    }
  },

  async updateArticle(articleId, partial) {
    const articles = this.getArticles()
    const author = partial.authorHandle ? this.getMember(partial.authorHandle) : null
    let target = null
    const updated = articles.map((a) => {
      if (a.id === articleId) {
        const rawTags = partial.tags !== undefined ? partial.tags : a.tags
        const tags = Array.isArray(rawTags)
          ? rawTags
          : typeof rawTags === 'string'
          ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
          : a.tags
        target = {
          ...a,
          ...partial,
          authorName: author ? author.name : (partial.authorName || a.authorName),
          authorAvatar: author ? author.avatar : (partial.authorAvatar || a.authorAvatar),
          tags,
        }
        return target
      }
      return a
    })
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updated))
    notify()

    if (target) {
      try {
        await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...target, type: 'article', handle: '__articles' }),
        })
        syncFromCloud().catch(() => {})
      } catch (e) {
        console.warn('[Azure Sync] updateArticle error:', e)
      }
    }

    return target
  },

  // 4. Missions
  getMissions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MISSIONS)
      if (data) {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m) => ({
            ...m,
            title: (m.title || '')
              .replace(/\[주간 미션\]/g, '')
              .replace(/\[동료 피드백\]/g, '')
              .replace(/\[부스트 퀘스트\]/g, '')
              .replace(/\[마일스톤 챌린지\]/g, '')
              .replace(/\s+/g, ' ')
              .trim(),
          }))
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e)
    }
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(DEFAULT_MISSIONS))
    return DEFAULT_MISSIONS
  },

  async addMission(mission) {
    const missions = this.getMissions()
    const newMis = {
      id: `mis-${Date.now()}`,
      title: mission.title,
      desc: mission.desc,
      reward: mission.reward || '동아리 포인트',
      category: mission.category || 'weekly',
      deadline: mission.deadline || '2026-10-31',
      completedMemberHandles: [],
      active: true,
    }
    missions.unshift(newMis)
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions))
    notify()

    try {
      await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMis, type: 'mission', handle: '__missions' }),
      })
      syncFromCloud().catch(() => {})
    } catch (e) {
      console.warn('[Azure Sync] addMission error:', e)
    }

    return newMis
  },

  async updateMission(missionId, partial) {
    if (!this.isAdmin()) throw new Error('공지사항을 수정할 권한이 없습니다.')
    const missions = this.getMissions()
    if (!missions.some((m) => m.id === missionId)) throw new Error('공지사항을 찾을 수 없습니다.')
    const changes = Object.fromEntries(
      ['title', 'desc', 'reward', 'category', 'deadline']
        .filter((key) => Object.hasOwn(partial, key))
        .map((key) => [key, partial[key]])
    )
    let target = null
    const updated = missions.map((m) => {
      if (m.id === missionId) {
        target = { ...m, ...changes }
        return target
      }
      return m
    })
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(updated))
    notify()

    if (target) {
      try {
        await fetch('/api/missions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...target, type: 'mission', handle: '__missions' }),
        })
        syncFromCloud().catch(() => {})
      } catch (e) {
        console.warn('[Azure Sync] updateMission error:', e)
      }
    }
  },

  async deleteMission(missionId) {
    const missions = this.getMissions().filter((m) => m.id !== missionId)
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions))
    notify()

    try {
      await fetch(`/api/missions?id=${encodeURIComponent(missionId)}`, {
        method: 'DELETE',
      })
      syncFromCloud().catch(() => {})
    } catch (e) {
      console.warn('[Azure Sync] deleteMission error:', e)
    }
  },

  async toggleMissionCompletion(missionId, memberHandle) {
    const cleanHandle = String(memberHandle || '').trim().toLowerCase()
    if (!cleanHandle) return
    const missions = this.getMissions()
    let target = null
    const updated = missions.map((m) => {
      if (m.id === missionId) {
        const rawHandles = Array.isArray(m.completedMemberHandles) ? m.completedMemberHandles : []
        const exists = rawHandles.some((h) => String(h).trim().toLowerCase() === cleanHandle)
        let nextHandles
        if (exists) {
          nextHandles = rawHandles.filter((h) => String(h).trim().toLowerCase() !== cleanHandle)
        } else {
          nextHandles = [...rawHandles, memberHandle]
        }
        target = { ...m, completedMemberHandles: nextHandles }
        return target
      }
      return m
    })
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(updated))
    notify()

    if (target) {
      try {
        await fetch('/api/missions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...target, type: 'mission', handle: '__missions' }),
        })
        syncFromCloud().catch(() => {})
      } catch (e) {
        console.warn('[Azure Sync] toggleMissionCompletion error:', e)
      }
    }

    return target
  },

  // 5. FAQs (자주 묻는 질문 - 관리자 CRUD)
  getFaqs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAQS)
      if (data) {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((item) => !item.q?.includes('Azure 시스템으로 DB 관리'))
            .map((item, idx) => ({
              ...item,
              id: item.id || `faq-${idx + 1}`,
            }))
        }
      }
    } catch (e) {
      console.warn('LocalStorage FAQ read error:', e)
    }
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(DEFAULT_FAQS))
    return DEFAULT_FAQS
  },

  async addFaq(faqItem) {
    const faqs = this.getFaqs()
    const newFaq = {
      id: `faq-${Date.now()}`,
      q: faqItem.q?.trim() || '새로운 질문',
      a: faqItem.a?.trim() || '',
      createdAt: new Date().toISOString(),
    }
    faqs.push(newFaq)
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(faqs))
    notify()

    try {
      await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newFaq, type: 'faq', handle: '__faqs' }),
      })
      syncFromCloud().catch(() => {})
    } catch (e) {
      console.warn('[Azure Sync] addFaq error:', e)
    }

    return newFaq
  },

  async updateFaq(faqId, partial) {
    const faqs = this.getFaqs()
    let target = null
    const updated = faqs.map((item) => {
      if (item.id === faqId) {
        target = {
          ...item,
          q: partial.q !== undefined ? partial.q.trim() : item.q,
          a: partial.a !== undefined ? partial.a.trim() : item.a,
          updatedAt: new Date().toISOString(),
        }
        return target
      }
      return item
    })
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(updated))
    notify()

    if (target) {
      try {
        await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...target, type: 'faq', handle: '__faqs' }),
        })
        syncFromCloud().catch(() => {})
      } catch (e) {
        console.warn('[Azure Sync] updateFaq error:', e)
      }
    }

    return target
  },

  async deleteFaq(faqId) {
    const faqs = this.getFaqs().filter((item) => item.id !== faqId)
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(faqs))
    notify()

    try {
      await fetch(`/api/faqs?id=${encodeURIComponent(faqId)}`, {
        method: 'DELETE',
      })
      syncFromCloud().catch(() => {})
    } catch (e) {
      console.warn('[Azure Sync] deleteFaq error:', e)
    }

    return true
  },

  // 5. Milestones (동적 조회수 기준, 보상 내용, 이모티콘 관리)
  getMilestones() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MILESTONES)
      if (data) {
        const list = JSON.parse(data)
        if (Array.isArray(list) && list.length > 0) {
          return list.sort((a, b) => (Number(a.count) || 0) - (Number(b.count) || 0))
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e)
    }
    return DEFAULT_MILESTONES
  },

  async updateMilestones(newList) {
    const sanitized = (Array.isArray(newList) ? newList : [])
      .map((item) => {
        const rawCount = Number(item.count)
        const count = isNaN(rawCount) ? 0 : Math.max(0, rawCount)
        return {
          count,
          icon: String(item.icon || '🌱').trim(),
          reward: String(item.reward || '').trim(),
          title: item.title || `${count} 달성`,
          badge: item.badge || `${count} 달성`,
          color: item.color || (count >= 250 ? 'gold' : count >= 200 ? 'violet' : count >= 150 ? 'orange' : count >= 100 ? 'pink' : count >= 50 ? 'amber' : 'mint'),
        }
      })
      .sort((a, b) => a.count - b.count)

    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(sanitized))
    notify()

    try {
      await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized),
      })
      syncFromCloud().catch(() => {})
    } catch (e) {
      console.warn('[Azure Sync] updateMilestones error:', e)
    }

    return sanitized
  },

  // 6. Cloud Backup & JSON Export
  exportAllData() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      club: 'Learn It, Teach (LIT)',
      challenge: 'Microsoft Learn Student Ambassadors 250 Challenge',
      members: this.getMembers(),
      articles: this.getArticles(),
      missions: this.getMissions(),
      faqs: this.getFaqs(),
    }
  },

  importAllData(jsonObj) {
    if (jsonObj && jsonObj.members && jsonObj.articles && jsonObj.missions) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(jsonObj.members))
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(jsonObj.articles))
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(jsonObj.missions))
      if (jsonObj.faqs) {
        localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(jsonObj.faqs))
      }
      notify()
      return true
    }
    return false
  },

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS))
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(DEFAULT_ARTICLES))
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(DEFAULT_MISSIONS))
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(DEFAULT_FAQS))
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'false')
    notify()
  },
}

