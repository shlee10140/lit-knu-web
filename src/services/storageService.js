// LIT x MSA 250 챌린지 데이터 및 스토리지 관리 서비스
// LocalStorage 기반 즉시 반응형 스토어 + Pub/Sub 이벤트 버스 탑재

const STORAGE_KEYS = {
  MEMBERS: 'lit_msa_members_prod',
  ARTICLES: 'lit_msa_articles_prod',
  MISSIONS: 'lit_msa_missions_prod',
  CURRENT_USER: 'lit_msa_current_user_prod',
  IS_ADMIN: 'lit_msa_is_admin_prod',
  FAQS: 'lit_msa_faqs_v1',
  MILESTONES: 'lit_msa_milestones_v2',
}

// 기본 마일스톤 및 리워드 정의 (LIT 내부 보상 결정 기준: 50, 100, 200, 250)
export const DEFAULT_MILESTONES = [
  {
    count: 50,
    title: '50 달성',
    icon: '✨',
    badge: '50 달성',
    reward: '던킨 미니 도넛 세트',
    desc: '달콤한 에너지 충전! 첫 마일스톤 달성',
    color: 'amber',
  },
  {
    count: 100,
    title: '100 달성',
    icon: '🔥',
    badge: '100 달성',
    reward: '싸이버거 세트',
    desc: '든든한 한 끼 식사! 세 자릿수 돌파 축하',
    color: 'pink',
  },
  {
    count: 200,
    title: '200 달성',
    icon: '⚡',
    badge: '200 달성',
    reward: '배민 상품권',
    desc: '맛있는 만찬 즐기기! 2만원 배민 상품권',
    color: 'violet',
  },
  {
    count: 250,
    title: '250 달성',
    icon: '👑',
    badge: 'MSA 달성',
    reward: 'LIT 명예의 전당 (MSA 달성)',
    desc: '200명 채우면 250명은 스스로 욕심이 생겨서 달성!',
    color: 'gold',
  },
]

export const MILESTONES = DEFAULT_MILESTONES

export const createSolidColorAvatar = (hexColor) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='${encodeURIComponent(hexColor)}'/%3E%3C/svg%3E`

export const AVATAR_COLORS = [
  '#3182F6', // Toss Blue
  '#FF6FB1', // LIT Pink
  '#8B7BFF', // LIT Violet
  '#FFD166', // LIT Amber
  '#38BDF8', // Sky Blue
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F43F5E', // Coral
]

export const AVATAR_PRESETS = AVATAR_COLORS.map(createSolidColorAvatar)

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    console.warn('[Storage] Quota exceeded or error saving to localStorage:', e)
    try {
      localStorage.removeItem('lit_verification_audits')
      localStorage.setItem(key, value)
    } catch (retryErr) {
      console.error('[Storage] Critical: localStorage full', retryErr)
    }
  }
}

// 이미지 압축 헬퍼 (모바일/DSLR 30MB 고화질 사진도 canvas/createImageBitmap을 통해 초고속 최적화)
export async function compressImage(file, maxWidth = 360, quality = 0.85) {
  if (!file) return ''

  // 1. createImageBitmap 지원 브라우저 (EXIF 자동 보정 및 초고속 비동기 디코딩)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      let width = bitmap.width
      let height = bitmap.height
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxWidth) / height)
          height = maxWidth
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, width)
      canvas.height = Math.max(1, height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(bitmap, 0, 0, width, height)
      bitmap.close?.()
      return canvas.toDataURL('image/jpeg', quality)
    } catch (e) {
      // Fallback 진행
    }
  }

  // 2. Fallback: FileReader + HTMLImageElement
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxWidth) / height)
            height = maxWidth
          }
        }
        canvas.width = Math.max(1, width)
        canvas.height = Math.max(1, height)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('이미지 처리 실패'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
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
  contributorId: '',
  certifications: 'LIT Official',
  clicks: 0,
  target: 0,
  msLink: '',
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
  avatar: AVATAR_PRESETS[2], // LIT Violet (#8B7BFF)
  badges: [],
  isAdmin: true,
}

export function formatContributorLink(idOrUrl) {
  if (!idOrUrl) return ''
  const trimmed = String(idOrUrl).trim()
  if (!trimmed) return ''
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
  if (!cleanId) {
    return {
      isValid: false,
      url: '',
      error: 'Contributor ID가 등록되지 않았습니다. 프로필 수정에서 Contributor ID를 먼저 입력해 주세요.',
    }
  }
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
    q: '체크포인트(50, 100, 200, 250) 리워드는 어떻게 받나요?',
    a: '본인의 대시보드에서 클릭수를 업데이트하면 리더보드에 자동으로 뱃지가 부여됩니다. 50 클릭(던킨 도넛), 100 클릭(싸이버거 세트), 200 클릭(배민 상품권), 250 클릭(LIT 명예의 전당/MSA 달성) 시 운영진이 확인 후 리워드를 전달합니다.',
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
let lastMilestonesSaveTime = 0
export async function syncFromCloud() {
  if (isSyncing || typeof window === 'undefined') return
  isSyncing = true
  let anyChanged = false

  try {
    // 1. Members 독립 동기화
    const pMembers = (async () => {
      const res = await fetchWithTimeout('/api/members')
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        if (!json) return
        const cloudMembers = Array.isArray(json.data) ? json.data : Array.isArray(json.members) ? json.members : []
        const currentMilestones = storageService.getMilestones()
        const localMembers = storageService.getMembers()
        const localMap = new Map(localMembers.map((lm) => [String(lm.handle || '').toLowerCase(), lm]))

        const cleanedMembers = cloudMembers
          .filter((m) => m.handle !== 'shlee' && m.name !== '이승환')
          .map((m) => {
            const h = String(m.handle || m.id).toLowerCase()
            const cloudRawClicks = Number(m.clicks)
            const clicks = isNaN(cloudRawClicks) ? 0 : Math.max(0, cloudRawClicks)

            let rawContributorId = (m.contributorId || '').trim()
            let rawMsLink = (m.msLink || '').trim()
            if (m.handle !== 'tlgjs' && m.handle !== 'LIT') {
              if (rawContributorId.includes('482865')) rawContributorId = ''
              if (rawMsLink.includes('482865')) rawMsLink = ''
            }
            const contributorId = rawContributorId
            const msLink = rawMsLink || (contributorId ? formatContributorLink(contributorId) : '')
            const badges = currentMilestones.filter((ml) => clicks >= ml.count).map((ml) => ml.badge)
            let avatar = m.avatar
            if (!avatar || avatar.includes('unsplash.com') || avatar.includes('dicebear')) {
              const hash = (m.handle || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
              avatar = AVATAR_PRESETS[Math.abs(hash) % AVATAR_PRESETS.length]
            }
            const safe = {
              ...m,
              handle: h,
              clicks,
              avatar,
              role: (m.role || 'LIT 부원').replace(/MLSA/g, 'MSA'),
              contributorId,
              certifications: m.certifications || '',
              msLink,
              badges,
            }
            delete safe.password
            return safe
          })

        const currentLocalStr = localStorage.getItem(STORAGE_KEYS.MEMBERS)
        const newMembersStr = JSON.stringify(cleanedMembers)
        if (currentLocalStr !== newMembersStr) {
          localStorage.setItem(STORAGE_KEYS.MEMBERS, newMembersStr)
          anyChanged = true
        }

        const currentHandle = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
        if (currentHandle && currentHandle.toUpperCase() !== 'LIT') {
          const stillExists = cleanedMembers.some((cm) => cm.handle.toLowerCase() === currentHandle.toLowerCase())
          if (!stillExists) {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
            anyChanged = true
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
        const currentArticles = storageService.getArticles()
        const localArticleMap = new Map(currentArticles.map((a) => [a.id, a]))
        const cleaned = cloudArticles.map((a) => {
          const localArt = localArticleMap.get(a.id)
          return {
            id: a.id,
            title: a.title || '',
            excerpt: a.excerpt || '',
            url: a.url || '',
            learnUrl: a.learnUrl || '',
            imageUrl: a.imageUrl || localArt?.imageUrl || '',
            platform: a.platform || 'linkedin',
            authorHandle: a.authorHandle || '',
            authorName: a.authorName || '',
            authorAvatar: a.authorAvatar || '',
            tags: a.tags || [],
            likes: a.likes || 0,
            createdAt: a.createdAt || '',
          }
        })
        const cloudIds = new Set(cloudArticles.map((a) => a.id))
        const recentlyAddedLocal = currentArticles.filter(
          (la) => !cloudIds.has(la.id) && Date.now() - (parseInt(String(la.id).replace('art-', ''), 10) || 0) < 60000
        )
        const merged = [...recentlyAddedLocal, ...cleaned]
        const localStr = localStorage.getItem(STORAGE_KEYS.ARTICLES)
        const newStr = JSON.stringify(merged)
        if (localStr !== newStr) {
          safeSetItem(STORAGE_KEYS.ARTICLES, newStr)
          anyChanged = true
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
            anyChanged = true
          }
        }
      }
    })()

    // 5. Milestones 독립 동기화 (조회수 기준, 보상 내용, 이모티콘 실시간 DB 연동)
    const pMilestones = (async () => {
      if (Date.now() - lastMilestonesSaveTime < 10000) return

      const res = await fetchWithTimeout('/api/milestones')
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        if (!json) return
        const cloudMilestones = Array.isArray(json.data) ? json.data : []
        if (cloudMilestones.length > 0) {
          if (Date.now() - lastMilestonesSaveTime < 10000) return

          if (cloudMilestones.some((m) => m.count === 30 || m.count === 150)) {
            storageService.updateMilestones(DEFAULT_MILESTONES).catch(() => {})
            return
          }

          const sorted = cloudMilestones
            .map((item) => {
              const rawCount = Number(item.count)
              const count = isNaN(rawCount) ? 0 : Math.max(0, rawCount)
              return {
                count,
                icon: String(item.icon || '✨').trim(),
                reward: String(item.reward || '').trim(),
                desc: String(item.desc || '').trim(),
                title: item.title || `${count} 달성`,
                badge: item.badge || `${count} 달성`,
                color: item.color || (count >= 250 ? 'gold' : count >= 200 ? 'violet' : count >= 100 ? 'pink' : 'amber'),
              }
            })
            .sort((a, b) => a.count - b.count)

          const localStr = localStorage.getItem(STORAGE_KEYS.MILESTONES)
          const newStr = JSON.stringify(sorted)
          if (localStr !== newStr) {
            localStorage.setItem(STORAGE_KEYS.MILESTONES, newStr)
            anyChanged = true
          }
        }
      }
    })()

    await Promise.allSettled([pMembers, pArticles, pFaqs, pMilestones])
    if (anyChanged) {
      notify()
    }
  } catch (err) {
    console.debug('[Azure Sync] Local-first mode active:', err.message)
  } finally {
    isSyncing = false
  }
}

// 브라우저 환경에서 실시간 클라우드 자동 동기화 활성화
// 첫 화면 렌더링을 방해하지 않도록 초기 동기화는 화면 표시 후 백그라운드에서 실행
if (typeof window !== 'undefined') {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => syncFromCloud())
  } else {
    setTimeout(syncFromCloud, 300)
  }
  window.addEventListener('focus', () => syncFromCloud())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncFromCloud()
  })
  setInterval(syncFromCloud, 15000)
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
        let modified = false
        const cleanedList = list.map((m) => {
          const rawClicks = Number(m.clicks)
          const clicks = isNaN(rawClicks) ? 0 : Math.max(0, rawClicks)
          let rawContributorId = (m.contributorId || '').trim()
          let rawMsLink = (m.msLink || '').trim()
          if (m.handle !== 'tlgjs' && m.handle !== 'LIT') {
            if (rawContributorId.includes('482865')) {
              rawContributorId = ''
              modified = true
            }
            if (rawMsLink.includes('482865')) {
              rawMsLink = ''
              modified = true
            }
          }
          const contributorId = rawContributorId
          const msLink = rawMsLink || (contributorId ? formatContributorLink(contributorId) : '')
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
            msLink,
            badges,
          }
          delete memberClean.generation
          delete memberClean.password
          return memberClean
        })
        if (modified) {
          localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(cleanedList))
        }
        return cleanedList
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
          const parsed = JSON.parse(savedAdmin)
          delete parsed.clicks
          delete parsed.target
          delete parsed.contributorId
          delete parsed.msLink
          delete parsed.badges
          Object.assign(ADMIN_MEMBER, parsed)
        }
      } catch (e) {}
      ADMIN_MEMBER.clicks = 0
      ADMIN_MEMBER.target = 0
      ADMIN_MEMBER.contributorId = ''
      ADMIN_MEMBER.msLink = ''
      ADMIN_MEMBER.badges = []
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

  getAuthToken() {
    try {
      return localStorage.getItem('lit_auth_token') || ''
    } catch {
      return ''
    }
  },

  setAuthToken(token) {
    try {
      if (token) {
        localStorage.setItem('lit_auth_token', token)
      } else {
        localStorage.removeItem('lit_auth_token')
      }
    } catch {}
  },

  getAuthHeaders() {
    const token = this.getAuthToken()
    return token ? { Authorization: `Bearer ${token}`, 'x-lit-auth-token': token } : {}
  },

  async loginMember(handle, password) {
    const clean = String(handle || '').trim()
    const inputPw = String(password || '').trim()

    if (!clean) {
      return { success: false, message: '아이디를 입력해 주세요.' }
    }
    if (!inputPw) {
      return { success: false, message: '비밀번호(학번)를 입력해 주세요.' }
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: clean, password: inputPw }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          if (data.token) {
            this.setAuthToken(data.token)
          }
          this.setAdmin(!!data.isAdmin)
          this.setCurrentUser(data.member.handle)
          notify()
          return { success: true, member: data.member, isAdmin: !!data.isAdmin }
        } else {
          return { success: false, message: data.message || '로그인에 실패했습니다.' }
        }
      }
    } catch (e) {
      console.warn('[Login] Server auth error, checking local fallback:', e)
    }

    // 오프라인/로컬 Fallback
    const member = this.getMember(clean)
    if (!member) {
      return { success: false, message: '등록되지 않은 아이디입니다.' }
    }
    this.setAdmin(false)
    this.setCurrentUser(member.handle)
    notify()
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
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({
          handle: clean,
          amount,
          isAbsolute,
          operator: this.isAdmin() ? '운영진 직접 조정' : `@${clean} 본인 수정`,
        }),
      })
    } catch (e) {
      console.debug('[Azure Sync] clicks error:', e)
    }

    return updated.find((m) => m.handle.toLowerCase() === clean.toLowerCase())
  },

  saveLocalVerificationAudit(audit) {
    try {
      const existing = JSON.parse(localStorage.getItem('lit_verification_audits') || '[]')
      existing.unshift(audit)
      const trimmed = existing.slice(0, 50)
      localStorage.setItem('lit_verification_audits', JSON.stringify(trimmed))
    } catch (e) {
      console.warn('Failed to save local verification audit:', e)
    }
  },

  async verifyMemberClicks(handle, imageBase64, mimeType = 'image/png') {
    const clean = String(handle).trim()
    let data = null
    try {
      const res = await fetch('/api/verify-clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({ handle: clean, imageBase64, mimeType }),
      })
      data = await res.json().catch(() => null)
      if (data && data.locationBlocked && data.delegateKey) {
        // Azure 홍콩 데이터센터 지역 제한으로 서버 대신 브라우저(한국) 환경에서 직접 Gemini 판독 수행
        const apiKey = data.delegateKey
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
        const prompt = `You are an automated audit assistant for the Microsoft Student Ambassadors (MSA) challenge.
The user submitted a screenshot to verify their Microsoft Student Ambassadors (Community Influencer / Preferred Visitors) activity clicks.

CRITICAL INSTRUCTIONS:
1. Microsoft Student Ambassadors sends periodic automated emails with the title / heading:
   "Your Community Influencer activity totals"
   containing:
   "Thank you for sharing Microsoft content on your path to becoming a Student Ambassador. Your activity count for total Preferred Visitors is below."
   followed by:
   "Total Preferred Visitors: <number>"
2. The user will often screenshot ONLY this email body section (or a cropped mobile/desktop view).
3. Even if the email client header (From address, Received date, mail client UI) is cropped out, ANY screenshot showing:
   - "Microsoft Student Ambassadors"
   - and/or "Your Community Influencer activity totals"
   - and "Total Preferred Visitors: <number>"
   is a 100% GENUINE, OFFICIAL Microsoft Student Ambassadors activity totals email!
   You MUST mark isValid = true! Do NOT reject it!
4. Extract the exact integer from "Total Preferred Visitors: <number>" (e.g., "Total Preferred Visitors: 26" -> clicks = 26).

Respond strictly in valid JSON with keys:
- isValid: boolean
- clicks: number (the integer value of Total Preferred Visitors, or null if not found)
- sender: string
- subject: string
- date: string
- summaryKorean: string
- confidence: number (0.0 to 1.0)
`
        const payload = {
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: mimeType || 'image/png', data: cleanBase64 } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        }

        const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite']
        let aiResult = null
        let lastErr = null

        for (const model of models) {
          try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
            if (!geminiRes.ok) {
              const errTxt = await geminiRes.text()
              lastErr = new Error(`Model ${model} (${geminiRes.status}): ${errTxt}`)
              continue
            }
            const json = await geminiRes.json()
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
              aiResult = JSON.parse(cleaned)
              break
            }
          } catch (e) {
            lastErr = e
          }
        }

        if (!aiResult) {
          throw lastErr || new Error('Gemini AI 메일 분석 응답을 가져오지 못했습니다.')
        }

        if (!aiResult.isValid || typeof aiResult.clicks !== 'number' || isNaN(aiResult.clicks)) {
          throw new Error(aiResult.summaryKorean || '유효한 Microsoft Student Ambassadors 활동 총계 메일 화면이 확인되지 않았습니다.')
        }

        const verifiedClicks = Math.max(0, Math.floor(aiResult.clicks))
        const prevClicks = this.getMember(clean)?.clicks || 0

        data = {
          success: true,
          verifiedClicks,
          previousClicks: prevClicks,
          details: aiResult,
          record: {
            id: `verify_${Date.now()}_${clean}`,
            handle: clean,
            type: 'verification',
            memberName: this.getMember(clean)?.name || clean,
            previousClicks: prevClicks,
            verifiedClicks,
            delta: verifiedClicks - prevClicks,
            sender: aiResult.sender || 'Microsoft Student Ambassadors',
            subject: aiResult.subject || 'Your Community Influencer activity totals',
            summaryKorean: aiResult.summaryKorean || '메일 인증 성공 (AI Vision)',
            evidenceImage: imageBase64,
            status: 'APPROVED',
            createdAt: new Date().toISOString(),
          },
        }
      } else if (!res.ok || !data || !data.success) {
        throw new Error(data?.reason || data?.message || `AI 메일 검증 처리에 실패했습니다. (응답 코드: ${res.status})`)
      }
    } catch (networkErr) {
      if (networkErr.message && !networkErr.message.includes('fetch')) {
        throw networkErr
      }
      throw new Error(`AI 메일 검증 서버 통신 오류: ${networkErr.message || '네트워크 상태를 확인해 주세요.'}`)
    }

    const verifiedClicks = data.verifiedClicks
    const currentMilestones = this.getMilestones()

    // Save approved audit
    if (data.record) {
      this.saveLocalVerificationAudit(data.record)
    } else {
      this.saveLocalVerificationAudit({
        id: `verify_${Date.now()}_${clean}`,
        handle: clean,
        type: 'verification',
        memberName: this.getMember(clean)?.name || clean,
        previousClicks: this.getMember(clean)?.clicks || 0,
        verifiedClicks,
        delta: verifiedClicks - (this.getMember(clean)?.clicks || 0),
        sender: data.details?.sender || 'Microsoft Student Ambassadors',
        subject: data.details?.subject || 'Your Community Influencer activity totals',
        summaryKorean: data.details?.summaryKorean || '메일 인증 성공',
        evidenceImage: imageBase64,
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
      })
    }

    if (clean.toUpperCase() === 'LIT') {
      ADMIN_MEMBER.clicks = verifiedClicks
      ADMIN_MEMBER.badges = currentMilestones.filter((ml) => verifiedClicks >= ml.count).map((ml) => ml.badge)
      try {
        localStorage.setItem('lit_admin_member_override', JSON.stringify(ADMIN_MEMBER))
      } catch (e) {}
    } else {
      const members = this.getMembers()
      const updated = members.map((m) => {
        if (m.handle.toLowerCase() === clean.toLowerCase()) {
          const badges = currentMilestones.filter((ml) => verifiedClicks >= ml.count).map((ml) => ml.badge)
          return {
            ...m,
            clicks: verifiedClicks,
            badges,
            lastVerifiedAt: new Date().toISOString(),
          }
        }
        return m
      })
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated))
    }
    notify()

    // Azure Cosmos DB로 인증된 클릭수 실시간 동기화
    try {
      await fetch('/api/clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({
          handle: clean,
          amount: verifiedClicks,
          isAbsolute: true,
          operator: 'Gemini AI Vision 인증',
        }),
      })
    } catch (syncErr) {
      console.warn('Failed to sync verified clicks to cloud:', syncErr)
    }

    // 서버에 검증 감사 로그 보존
    try {
      const auditPayload = data.record || {
        id: `verify_${Date.now()}_${clean}`,
        handle: clean,
        type: 'verification',
        memberName: this.getMember(clean)?.name || clean,
        previousClicks: this.getMember(clean)?.clicks || 0,
        verifiedClicks,
        delta: verifiedClicks - (this.getMember(clean)?.clicks || 0),
        sender: data.details?.sender || 'Microsoft Student Ambassadors',
        subject: data.details?.subject || 'Your Community Influencer activity totals',
        summaryKorean: data.details?.summaryKorean || '메일 인증 성공',
        evidenceImage: imageBase64,
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
      }
      await fetch('/api/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(auditPayload),
      })
    } catch (_) {}

    return data
  },

  async getVerificationAuditLogs() {
    let remoteLogs = []
    try {
      const res = await fetch('/api/verifications')
      const data = await res.json()
      remoteLogs = data.data || []
    } catch (e) {
      console.warn('[Audit Sync] verifications error:', e)
    }

    let localLogs = []
    try {
      localLogs = JSON.parse(localStorage.getItem('lit_verification_audits') || '[]')
    } catch (e) {}

    const map = new Map()
    for (const log of [...localLogs, ...remoteLogs]) {
      if (log && log.id && !map.has(log.id)) {
        map.set(log.id, log)
      }
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async updateMemberProfile(handle, partial) {
    if (!this.checkEditPermission(handle)) {
      alert('본인의 프로필만 수정할 수 있습니다. (관리자만 타인 계정 수정 가능)')
      return null
    }

    const sanitized = { ...partial }
    delete sanitized.generation
    const passwordToUpdate = sanitized.password
    delete sanitized.password

    if (sanitized.contributorId !== undefined) {
      sanitized.contributorId = (sanitized.contributorId || '').trim()
      sanitized.msLink = sanitized.contributorId ? formatContributorLink(sanitized.contributorId) : ''
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
        const payloadToSend = {
          ...savedMember,
          ...(passwordToUpdate ? { password: passwordToUpdate } : {}),
        }
        const res = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
          body: JSON.stringify(payloadToSend),
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

    const contributorId = (newMember.contributorId || '').trim()
    const msLink = contributorId ? formatContributorLink(contributorId) : ''
    const memberObj = {
      id: cleanHandle,
      handle: cleanHandle,
      name: (newMember.name || '').trim() || 'LIT 부원',
      password: (newMember.password || '').trim(),
      role: (newMember.role || '').trim(),
      major: (newMember.major || '').trim(),
      certifications: (newMember.certifications || '').trim(),
      contributorId: contributorId,
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

    const localMember = { ...memberObj }
    delete localMember.password

    members.push(localMember)
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members))
    this.setCurrentUser(localMember.handle)
    notify()

    // Azure Cosmos DB로 신규 부원 실시간 전송
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(memberObj),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.token) {
          this.setAuthToken(data.token)
        }
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

    return localMember
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
        headers: { ...this.getAuthHeaders() },
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
      return this.getMember('LIT')
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
    this.setAuthToken(null)
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
      imageUrl: article.imageUrl || '',
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
    safeSetItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles))
    notify()

    try {
      await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
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
          headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
          body: JSON.stringify({ ...target, type: 'article', handle: '__articles' }),
        })
      } catch (e) {
        console.warn('[Azure Sync] toggleArticleLike error:', e)
      }
    }
  },

  async deleteArticle(articleId) {
    const articles = this.getArticles().filter((a) => a.id !== articleId)
    safeSetItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles))
    notify()

    try {
      await fetch(`/api/articles?id=${encodeURIComponent(articleId)}`, {
        method: 'DELETE',
        headers: { ...this.getAuthHeaders() },
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
    safeSetItem(STORAGE_KEYS.ARTICLES, JSON.stringify(updated))
    notify()

    if (target) {
      try {
        await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
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
          headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
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
        headers: { ...this.getAuthHeaders() },
      })
      syncFromCloud().catch(() => {})
    } catch (e) {
      console.warn('[Azure Sync] deleteFaq error:', e)
    }

    return true
  },

  getMilestones() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MILESTONES)
      if (data) {
        const list = JSON.parse(data)
        if (Array.isArray(list) && list.length > 0 && !list.some((m) => m.count === 30 || m.count === 150)) {
          return list.sort((a, b) => (Number(a.count) || 0) - (Number(b.count) || 0))
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e)
    }
    return DEFAULT_MILESTONES
  },

  async updateMilestones(newList) {
    lastMilestonesSaveTime = Date.now()
    const sanitized = (Array.isArray(newList) ? newList : [])
      .map((item) => {
        const rawCount = Number(item.count)
        const count = isNaN(rawCount) ? 0 : Math.max(0, rawCount)
        return {
          count,
          icon: String(item.icon || '✨').trim(),
          reward: String(item.reward || '').trim(),
          desc: String(item.desc || '').trim(),
          title: item.title || `${count} 달성`,
          badge: item.badge || `${count} 달성`,
          color: item.color || (count >= 250 ? 'gold' : count >= 200 ? 'violet' : count >= 100 ? 'pink' : 'amber'),
        }
      })
      .sort((a, b) => a.count - b.count)

    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(sanitized))
    notify()

    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(sanitized),
      })
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const confirmed = json.data
            .map((item) => ({
              count: Number(item.count) || 0,
              icon: String(item.icon || '✨').trim(),
              reward: String(item.reward || '').trim(),
              desc: String(item.desc || '').trim(),
              title: item.title || `${item.count} 달성`,
              badge: item.badge || `${item.count} 달성`,
              color: item.color || (item.count >= 250 ? 'gold' : item.count >= 200 ? 'violet' : item.count >= 100 ? 'pink' : 'amber'),
            }))
            .sort((a, b) => a.count - b.count)
          localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(confirmed))
          notify()
        }
      }
    } catch (e) {
      console.warn('[Azure Sync] updateMilestones error:', e)
    }

    return sanitized
  },

  // 6. Cloud Backup & JSON Export
  async pushAllToCloud() {
    const payload = {
      members: this.getMembers(),
      articles: this.getArticles(),
      faqs: this.getFaqs(),
    }
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[Azure Cosmos DB Bulk Sync Complete]:', data)
        return { success: true, data }
      }
      return { success: false, status: res.status }
    } catch (err) {
      console.warn('[Azure Cosmos DB Bulk Sync Error]:', err)
      return { success: false, error: err.message }
    }
  },

  exportAllData() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      club: 'Learn It, Teach (LIT)',
      challenge: 'Microsoft Learn Student Ambassadors 250 Challenge',
      members: this.getMembers(),
      articles: this.getArticles(),
      faqs: this.getFaqs(),
    }
  },

  importAllData(jsonObj) {
    if (jsonObj && jsonObj.members && jsonObj.articles) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(jsonObj.members))
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(jsonObj.articles))
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
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(DEFAULT_FAQS))
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'false')
    this.setAuthToken(null)
    notify()
  },

  async resetAllMemberClicks() {
    ADMIN_MEMBER.clicks = 0
    const list = this.getMembers().map((m) => ({
      ...m,
      clicks: 0,
      badges: [],
    }))
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(list))
    notify()

    try {
      await fetch('/api/clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({
          resetAll: true,
          operator: '운영진 전체 클릭수 초기화',
        }),
      })
    } catch (e) {
      console.warn('Reset all clicks API failed:', e)
    }
  },
}

