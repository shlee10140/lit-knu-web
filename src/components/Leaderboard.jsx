import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Check,
  ChevronRight,
  Edit3,
  GraduationCap,
  MousePointerClick,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { storageService } from '../services/storageService.js'
import MemberAvatarBadge, { MemberTierChip } from './ui/MemberAvatarBadge.jsx'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'


export default function Leaderboard({ onFilterAuthor, onSelectMember, onOpenProfile, onEditMember, onOpenAuth }) {
  const [members, setMembers] = useState(storageService.getMembers())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())
  const [milestones, setMilestones] = useState(() => storageService.getMilestones())
  const [articles, setArticles] = useState(() => storageService.getArticles())
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef(null)

  const handleProfileView = onOpenProfile || onSelectMember

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setMembers(storageService.getMembers())
      setIsAdmin(storageService.isAdmin())
      setMilestones(storageService.getMilestones())
      setArticles(storageService.getArticles())
    })
    return unsub
  }, [])

  // 동아리 전체 종합 통계 계산
  const targetClicks = milestones.length > 0 ? milestones[milestones.length - 1].count : 250
  const totalClicks = members.reduce((acc, m) => acc + (m.clicks || 0), 0)
  const finishersCount = members.filter((m) => (m.clicks || 0) >= targetClicks).length
  const activeMembersCount = members.length
  const totalArticlesCount = articles.length

  // 정렬: 클릭수 내림차순
  const sortedMembers = [...members].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))

  // 필터 적용
  const filteredMembers = sortedMembers.filter((m) => {
    // 탭 필터
    if (activeTab !== 'all') {
      const minCount = Number(activeTab)
      if (!isNaN(minCount) && (m.clicks || 0) < minCount) return false
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = m.name.toLowerCase().includes(q)
      const matchHandle = m.handle.toLowerCase().includes(q)
      const matchMajor = (m.major || '').toLowerCase().includes(q)
      return matchName || matchHandle || matchMajor
    }
    return true
  })

  return (
    <section id="leaderboard" className="relative scroll-mt-24 px-4 sm:px-6 py-24 sm:py-32 overflow-hidden">
      <span id="dashboard" className="absolute -top-24" />
      {/* Glow */}
      <div className="pointer-events-none absolute right-1/4 top-1/3 -z-10 h-[320px] w-[320px] sm:h-[500px] sm:w-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,123,255,0.12)_0%,transparent_70%)] blur-[25px] md:blur-[100px]" />

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionHeading
              title="챌린지"
              accent="대시보드"
              desc="부원별 실시간 달성 조회수와 리더보드입니다. 부원을 클릭하면 상세 프로필을 확인할 수 있습니다."
            />
          </div>

          {/* 관리자 전용: 신규 부원 등록 버튼 */}
          {isAdmin && (
            <div className="shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onOpenAuth?.('register')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#3182F6] hover:bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>신규 부원 직접 등록</span>
              </button>
            </div>
          )}
        </div>

        {/* 동아리 전체 요약 통계 그리드 (리더보드 상단) */}
        <Reveal delay={0.05} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 items-stretch">
          <div
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
              e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
            }}
            className="spotlight-card glass group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 transition-colors duration-200 hover:border-pink/40 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between text-muted">
                <span className="text-xs font-semibold text-fg/80">전체 클릭</span>
                <MousePointerClick className="h-4 w-4 text-pink" />
              </div>
              <div className="mt-2.5 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                {totalClicks.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-muted">회</span>
              </div>
            </div>
          </div>

          <div
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
              e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
            }}
            className="spotlight-card glass group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 transition-colors duration-200 hover:border-amber/40 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between text-muted">
                <span className="text-xs font-semibold text-fg/80">MSA 달성 부원</span>
                <Trophy className="h-4 w-4 text-amber" />
              </div>
              <div className="mt-2.5 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                {finishersCount}
                <span className="ml-1 text-xs font-normal text-muted">명</span>
              </div>
            </div>
          </div>

          <div
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
              e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
            }}
            className="spotlight-card glass group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 transition-colors duration-200 hover:border-violet/40 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between text-muted">
                <span className="text-xs font-semibold text-fg/80">참여 부원</span>
                <UserCheck className="h-4 w-4 text-violet" />
              </div>
              <div className="mt-2.5 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                {activeMembersCount}
                <span className="ml-1 text-xs font-normal text-muted">명</span>
              </div>
            </div>
          </div>

          <div
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
              e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
            }}
            className="spotlight-card glass group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 transition-colors duration-200 hover:border-mint/40 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between text-muted">
                <span className="text-xs font-semibold text-fg/80">공유된 글</span>
                <Share2 className="h-4 w-4 text-mint" />
              </div>
              <div className="mt-2.5 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                {totalArticlesCount}
                <span className="ml-1 text-xs font-normal text-muted">편</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* 2. 컨트롤 바 (검색 토글) */}
        <Reveal delay={0.15} className="mt-6">
          <div className="flex justify-end items-center min-h-[40px]">
            <AnimatePresence mode="wait">
              {!isSearchOpen && !searchQuery ? (
                <motion.button
                  key="search-btn"
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(true)
                    setTimeout(() => searchInputRef.current?.focus(), 80)
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-fg/80 hover:text-fg shadow-xs hover:border-mint/50 cursor-pointer transition-colors"
                  title="부원 검색창 열기"
                >
                  <Search className="h-3.5 w-3.5 text-mint group-hover:scale-110 transition-transform" />
                  <span>검색</span>
                </motion.button>
              ) : (
                <motion.div
                  key="search-input"
                  initial={{ opacity: 0, width: 60, scale: 0.95 }}
                  animate={{ opacity: 1, width: '100%', scale: 1 }}
                  exit={{ opacity: 0, width: 60, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full sm:w-72"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mint pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    autoCapitalize="none"
                    autoCorrect="off"
                    enterKeyHint="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchQuery('')
                        setIsSearchOpen(false)
                      }
                    }}
                    placeholder="부원 이름, 전공 검색..."
                    className="glass w-full rounded-full py-2.5 sm:py-2 pl-9 pr-9 text-xs text-fg placeholder:text-muted focus:border-mint/60 focus:outline-none shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setIsSearchOpen(false)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-muted hover:text-fg hover:bg-white/10 cursor-pointer transition-colors"
                    title="검색 닫기"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        {/* 3. 리더보드 순위 목록 */}
        <div className="mt-6 space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center text-muted">
              <p className="text-sm">해당 조건에 일치하는 부원이 없습니다.</p>
            </div>
          ) : (
            filteredMembers.map((m, index) => {
              const rank = sortedMembers.findIndex((orig) => orig.handle === m.handle) + 1
              const maxMilestoneCount = milestones.length > 0 ? milestones[milestones.length - 1].count : 250
              const percent = Math.min(100, Math.round(((m.clicks || 0) / maxMilestoneCount) * 100))
              const isTop3 = rank <= 3
              const isFinished = (m.clicks || 0) >= maxMilestoneCount

              return (
                <div
                  key={m.handle}
                  onClick={() => handleProfileView?.(m)}
                  onMouseMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
                    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
                  }}
                  title={`${m.name} 부원의 상세 프로필 보기`}
                  className="spotlight-card group relative cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface/80 p-4 sm:p-5 transition-all duration-200 hover:border-[#3182f6]/40 hover:bg-surface hover:shadow-xl hover:-translate-y-0.5"
                >
                  <div className="flex flex-col">
                    {/* 1. 상단: 순위 & 프로필 정보 (좌측) + 실시간 클릭수 (우측) */}
                    <div className="flex items-start justify-between gap-3 sm:items-center">
                      <div className="flex items-start gap-2.5 sm:items-center sm:gap-3.5 min-w-0 flex-1">
                        {/* Rank badge */}
                        <div className="flex shrink-0 items-center justify-center min-w-[32px] sm:min-w-[38px]">
                          {rank === 1 ? (
                            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-2.5 py-0.5 text-[11px] sm:text-xs font-black text-white">
                              1위
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-slate-400 to-slate-500 px-2.5 py-0.5 text-[11px] sm:text-xs font-bold text-white">
                              2위
                            </span>
                          ) : rank === 3 ? (
                            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-700 to-orange-600 px-2.5 py-0.5 text-[11px] sm:text-xs font-bold text-white">
                              3위
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center rounded-full bg-surface border border-line px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-muted">
                              {rank}위
                            </span>
                          )}
                        </div>

                        {/* Avatar & Tier Badge (프로필 우측 하단 아이콘 뱃지) */}
                        <div className="relative shrink-0">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-line object-cover transition-transform group-hover:scale-105"
                          />
                          <MemberAvatarBadge member={m} size="sm" />
                        </div>

                        {/* Name & Major */}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm sm:text-base font-bold text-fg leading-tight group-hover:text-[#3182f6] transition-colors">
                            {m.name}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2 sm:line-clamp-1 break-words">
                            {[m.role, m.major].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>

                      {/* Clicks & Percent (상단 우측 정렬) */}
                      <div
                        onClick={(e) => {
                          if (isAdmin) {
                            e.stopPropagation()
                            handleProfileView?.(m)
                          }
                        }}
                        className={`text-right shrink-0 ${isAdmin ? 'cursor-pointer group/clicks' : ''}`}
                        title={isAdmin ? '클릭하여 프로필 및 클릭수 직접 수정' : undefined}
                      >
                        <div className="flex items-baseline justify-end gap-1">
                          <span className={`font-sans text-xl sm:text-2xl font-black tracking-tight text-fg ${isAdmin ? 'group-hover/clicks:text-[#3182F6] transition-colors' : ''}`}>
                            {m.clicks || 0}
                          </span>
                          <span className="text-xs text-muted/60 font-normal">회</span>
                        </div>
                        <div className="mt-0.5 text-right text-[11px]">
                          <span className={isFinished ? 'text-mint font-semibold' : 'text-muted/70 font-medium'}>
                            {percent}% 달성
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. 중단: 슬림 정밀 프로그레스 게이지 */}
                    <div className="mt-3 w-full">
                      <div className="h-1 sm:h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFinished
                              ? 'bg-mint'
                              : isTop3
                              ? 'bg-gradient-to-r from-pink to-mint'
                              : 'bg-white/40'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 3. 하단: 자격증/250 달성 (좌측) + 관리자 버튼/화살표 (우측) */}
                    <div className="mt-3 flex items-center justify-between gap-2 min-h-[28px]">
                      {/* 자격증 / 달성 뱃지 컨테이너 */}
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {isFinished && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-500 whitespace-nowrap">
                            <Trophy className="h-3.5 w-3.5" />
                            <span>250 달성</span>
                          </span>
                        )}
                        {m.certifications &&
                          m.certifications
                            .split(',')
                            .map((c) => c.trim())
                            .filter(Boolean)
                            .map((cert) => (
                              <span
                                key={cert}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-2.5 py-1 text-[11px] font-medium text-fg/90 whitespace-nowrap"
                              >
                                <GraduationCap className="h-3.5 w-3.5 text-mint" />
                                <span>{cert}</span>
                              </span>
                            ))}
                      </div>

                      {/* 우측: 관리자 도구 or 세련된 카드 상세 화살표 */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditMember?.(m)
                            }}
                            title={`${m.name} 부원의 정보 관리`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#3182F6]/30 bg-[#3182F6]/10 px-2 py-1 text-[11px] font-medium text-[#3182F6] whitespace-nowrap shrink-0 transition-all hover:bg-[#3182F6]/20 cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span className="hidden sm:inline">정보 수정</span>
                          </button>
                        )}

                        {/* 카드 클릭 가능함을 알리는 서틀한 우측 화살표 (호버 시 부드럽게 이동) */}
                        <div className="text-muted/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#3182f6]">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

