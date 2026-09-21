import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  ChevronRight,
  Edit3,
  Flame,
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
} from 'lucide-react'
import { storageService } from '../services/storageService.js'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'

export default function Leaderboard({ onFilterAuthor, onSelectMember, onOpenProfile, onEditMember, onOpenAuth }) {
  const [members, setMembers] = useState(storageService.getMembers())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())
  const [milestones, setMilestones] = useState(() => storageService.getMilestones())
  const [articles, setArticles] = useState(() => storageService.getArticles())
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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
      <div className="pointer-events-none absolute right-1/4 top-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-violet/10 blur-[150px]" />

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Dashboard"
          title="챌린지"
          accent="대시보드"
          desc="부원별 실시간 달성 조회수와 리더보드입니다. 부원을 클릭하면 상세 프로필을 확인할 수 있습니다."
        />

        {/* 관리자 모드 안내 및 빠른 부원 등록 */}
        {isAdmin && (
          <Reveal delay={0.1} className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink/40 bg-pink/10 p-3.5 sm:px-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-pink" />
                <span className="font-display text-xs sm:text-sm font-bold text-fg">
                  👑 운영진 관리자 모드 활성
                </span>
                <span className="text-xs text-muted hidden md:inline">
                  · 부원 정보 관리 및 빠른 클릭수 조작(+/-), 프로필 수정을 직접 수행할 수 있습니다.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))] px-3.5 py-1.5 text-xs font-bold text-bg transition-transform hover:scale-105 shadow-md shadow-pink/20"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  신규 부원 직접 등록
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {/* 동아리 전체 요약 통계 그리드 (리더보드 상단) */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 items-stretch">
          <Reveal delay={0.05} className="h-full">
            <div className="glass group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-pink/40 hover:bg-white/[0.06]">
              <div>
                <div className="flex items-center justify-between text-muted">
                  <span className="text-xs font-medium text-fg/80">전체 클릭</span>
                  <Flame className="h-4 w-4 text-pink" />
                </div>
                <div className="mt-2.5 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                  {totalClicks.toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-muted">회</span>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-pink to-violet opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Reveal>

          <Reveal delay={0.1} className="h-full">
            <div className="glass group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-amber/40 hover:bg-white/[0.06]">
              <div>
                <div className="flex items-center justify-between text-muted">
                  <span className="text-xs font-medium text-fg/80">MSA 달성 부원</span>
                  <Trophy className="h-4 w-4 text-amber" />
                </div>
                <div className="mt-2.5 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                  {finishersCount}
                  <span className="ml-1 text-xs font-normal text-muted">명</span>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber to-mint opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Reveal>

          <Reveal delay={0.15} className="h-full">
            <div className="glass group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-violet/40 hover:bg-white/[0.06]">
              <div>
                <div className="flex items-center justify-between text-muted">
                  <span className="text-xs font-medium text-fg/80">참여 부원</span>
                  <UserCheck className="h-4 w-4 text-violet" />
                </div>
                <div className="mt-2.5 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                  {activeMembersCount}
                  <span className="ml-1 text-xs font-normal text-muted">명</span>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet to-mint opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Reveal>

          <Reveal delay={0.2} className="h-full">
            <div className="glass group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-mint/40 hover:bg-white/[0.06]">
              <div>
                <div className="flex items-center justify-between text-muted">
                  <span className="text-xs font-medium text-fg/80">공유된 글</span>
                  <Share2 className="h-4 w-4 text-mint" />
                </div>
                <div className="mt-2.5 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
                  {totalArticlesCount}
                  <span className="ml-1 text-xs font-normal text-muted">편</span>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-mint to-pink opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Reveal>
        </div>

        {/* 2. 컨트롤 바 (검색) */}
        <Reveal delay={0.15} className="mt-6">
          <div className="flex justify-end">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="부원 이름, 전공 검색..."
                className="glass w-full rounded-full py-2 pl-9 pr-4 text-xs text-fg placeholder:text-muted focus:border-mint/60 focus:outline-none"
              />
            </div>
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
                <motion.div
                  key={m.handle}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-line bg-surface/60 p-5 sm:p-6 transition-all hover:border-white/30 hover:bg-surface"
                >
                  <div className="flex flex-col">
                    {/* 1. 상단: 순위 & 프로필 정보 (좌측) + 실시간 클릭수 (우측) */}
                    <div className="flex items-start justify-between gap-3 sm:items-center">
                      <div
                        onClick={() => handleProfileView?.(m)}
                        role="button"
                        tabIndex={0}
                        title={`${m.name} 부원의 상세 프로필 보기`}
                        className="flex items-start gap-3 sm:items-center sm:gap-4 min-w-0 flex-1 cursor-pointer group/info"
                      >
                        {/* Rank badge */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-black tracking-tight sm:h-11 sm:w-11 sm:text-xl">
                          <span className="text-muted font-mono text-sm sm:text-base font-bold">#{rank}</span>
                        </div>

                        {/* Avatar */}
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl border border-line object-cover mt-0.5 sm:mt-0 transition-transform group-hover/info:scale-105"
                        />

                        {/* Name & Major (모바일에서도 소개가 잘리지 않고 온전히 표시) */}
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-base sm:text-lg font-bold text-fg leading-tight group-hover/info:text-mint transition-colors">
                            {m.name}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2 sm:line-clamp-1 break-words">
                            {[m.role, m.major].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>

                      {/* Clicks & Percent (상단 우측 정렬) */}
                      <div className="text-right shrink-0 pt-0.5 sm:pt-0">
                        <div className="flex items-baseline justify-end gap-1 sm:gap-1.5">
                          <span className="font-sans text-xl sm:text-3xl font-black text-fg">
                            {m.clicks || 0}
                          </span>
                          <span className="font-mono text-[11px] sm:text-xs text-muted">/ 250</span>
                          <span className="font-mono text-[11px] sm:text-xs font-semibold text-mint">
                            ({percent}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. 중단: 전체 너비 프로그레스 게이지 (시원하고 안정적인 배치) */}
                    <div className="mt-3.5 sm:mt-4 w-full">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFinished
                              ? 'bg-mint shadow-[0_0_8px_rgba(94,240,214,0.5)]'
                              : isTop3
                              ? 'bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))]'
                              : 'bg-violet'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 3. 하단: 뱃지/자격증 (좌측) + 액션 버튼 (우측) */}
                    <div className="mt-3 flex items-center justify-between gap-2 min-h-[36px]">
                      {/* Badges container: 250 달성과 자격증 모두 AI-900과 동일한 둥근 사각형 및 색상 통일 디자인 */}
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {isFinished && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] font-semibold text-fg/90 whitespace-nowrap shadow-sm">
                            <span>👑</span>
                            <span>250 달성!</span>
                          </span>
                        )}
                        {m.certifications && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] font-semibold text-fg/90 whitespace-nowrap shadow-sm">
                            <span>🎓</span>
                            <span>{m.certifications}</span>
                          </span>
                        )}
                      </div>

                      {/* Action buttons & Admin quick click buttons */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* 관리자용 클릭수 빠른 증감 (+/-) */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 mr-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                storageService.updateMemberClicks(m.handle, -1)
                              }}
                              title={`${m.name} 클릭수 -1`}
                              className="glass flex h-7 px-1.5 items-center justify-center rounded-lg font-mono text-[11px] font-bold text-muted transition-all active:scale-90 hover:text-pink hover:border-pink/50 hover:bg-pink/15 cursor-pointer"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                storageService.updateMemberClicks(m.handle, 1)
                              }}
                              title={`${m.name} 클릭수 +1`}
                              className="glass flex h-7 px-1.5 items-center justify-center rounded-lg font-mono text-[11px] font-bold text-muted transition-all active:scale-90 hover:text-mint hover:border-mint/50 hover:bg-mint/15 cursor-pointer"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                storageService.updateMemberClicks(m.handle, 5)
                              }}
                              title={`${m.name} 클릭수 +5`}
                              className="glass flex h-7 px-1.5 items-center justify-center rounded-lg font-mono text-[11px] font-bold text-muted transition-all active:scale-90 hover:text-mint hover:border-mint/50 hover:bg-mint/15 cursor-pointer"
                            >
                              +5
                            </button>
                          </div>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onEditMember?.(m)}
                            title={`${m.name} 부원의 정보, 소개, 클릭수 직접 관리`}
                            className="inline-flex items-center gap-1 rounded-xl border border-pink/40 bg-pink/15 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-pink whitespace-nowrap shrink-0 transition-all hover:bg-pink/25 hover:border-pink"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">정보 수정</span>
                            <span className="sm:hidden">수정</span>
                          </button>
                        )}

                        {/* 프로필 보기 버튼 */}
                        <button
                          type="button"
                          onClick={() => handleProfileView?.(m)}
                          title={`${m.name} 부원의 상세 프로필 보기`}
                          className="glass inline-flex items-center justify-center gap-1 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-fg whitespace-nowrap shrink-0 transition-all hover:bg-white/10 hover:border-mint/50"
                        >
                          <User className="h-3.5 w-3.5 text-mint" />
                          <span>프로필</span>
                        </button>

                        <button
                          onClick={() => onFilterAuthor(m.handle)}
                          title="이 부원이 작성한 글 모음 보기"
                          className="glass inline-flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-fg whitespace-nowrap shrink-0 transition-all hover:bg-white/10 hover:border-mint/50"
                        >
                          <span>글 모음</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

