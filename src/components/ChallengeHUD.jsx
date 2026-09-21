import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Plus,
  Sparkles,
  TrendingUp,
  UserCheck,
  Edit3,
  ArrowRight,
  AlertCircle,
  X,
  LogIn,
  UserPlus,
} from 'lucide-react'
import {
  storageService,
  extractContributorId,
  generateContributorUrl,
  validateAndGenerateContributorUrl,
} from '../services/storageService.js'
import MagneticButton from './ui/MagneticButton.jsx'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'

export default function ChallengeHUD({ onOpenProfile, onOpenAuth, onFilterAuthor }) {
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser())
  const [members, setMembers] = useState(storageService.getMembers())
  const [articles, setArticles] = useState(storageService.getArticles())
  const [milestones, setMilestones] = useState(() => storageService.getMilestones())
  const [copied, setCopied] = useState(false)
  const [justAdded, setJustAdded] = useState(null)

  // MS Learn Contributor URL 생성기 상태
  const [isUrlGenOpen, setIsUrlGenOpen] = useState(false)
  const [inputLearnUrl, setInputLearnUrl] = useState('')
  const [copiedGenUrl, setCopiedGenUrl] = useState(false)

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser())
      setMembers(storageService.getMembers())
      setArticles(storageService.getArticles())
      setMilestones(storageService.getMilestones())
    })
    return unsub
  }, [])

  const targetClicks = milestones.length > 0 ? milestones[milestones.length - 1].count : 250

  // 내 다음 마일스톤 계산
  const myClicks = currentUser ? currentUser.clicks || 0 : 0
  const progressPercent = Math.min(100, Math.round((myClicks / targetClicks) * 100))
  const nextMilestone = milestones.find((m) => m.count > myClicks) || milestones[milestones.length - 1] || { count: 250, title: '250 달성' }
  const isFinished = myClicks >= targetClicks
  const clicksLeft = isFinished ? 0 : nextMilestone.count - myClicks

  // 클릭수 빠른 증가
  const handleQuickAdd = (delta) => {
    if (!currentUser) return
    storageService.updateMemberClicks(currentUser.handle, delta)
    setJustAdded(`+${delta}`)
    setTimeout(() => setJustAdded(null), 1200)
  }

  // 링크 복사
  const handleCopyLink = () => {
    if (!currentUser?.msLink) return
    navigator.clipboard.writeText(currentUser.msLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // MS Learn Contributor URL 생성기
  const myContributorId = currentUser?.contributorId || extractContributorId(currentUser?.msLink) || 'studentamb_482865'
  const urlValidation = useMemo(
    () => validateAndGenerateContributorUrl(inputLearnUrl, myContributorId),
    [inputLearnUrl, myContributorId]
  )
  const generatedUrl = urlValidation.isValid ? urlValidation.url : ''
  const urlError = urlValidation.error

  const handleCopyGenUrl = () => {
    if (!generatedUrl) return
    navigator.clipboard.writeText(generatedUrl)
    setCopiedGenUrl(true)
    setTimeout(() => setCopiedGenUrl(false), 2000)
  }

  const samplePresets = [
    { label: 'Azure AI 기초', url: 'https://learn.microsoft.com/training/modules/get-started-with-ai-in-azure/' },
    { label: 'GitHub Copilot', url: 'https://learn.microsoft.com/training/modules/get-started-github-copilot/?practice-assessment-type=certification' },
    { label: 'Fabric 기초', url: 'https://learn.microsoft.com/training/paths/get-started-fabric/' },
  ]

  return (
    <section id="dashboard" className="relative scroll-mt-24 px-4 sm:px-6 py-20 sm:py-28 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[500px] w-[90vw] -translate-x-1/2 rounded-full bg-gradient-to-b from-pink/15 via-violet/10 to-mint/10 blur-[140px]" />

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Dashboard"
          title="챌린지"
          accent="대시보드"
          desc="나의 챌린지 진행 상태와 실시간 활동을 확인하세요."
        />

        {/* 2. My Progress Interactive HUD Card or Guest Invitation Card */}
        {!currentUser ? (
          <Reveal delay={0.25} className="mt-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface/75 p-6 sm:p-10 backdrop-blur-xl text-center shadow-2xl">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink/10 blur-[120px]" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-mint/8 blur-[120px]" />

              <div className="relative mx-auto max-w-lg">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pink/40 bg-pink/15 px-3.5 py-1 font-mono text-[11px] font-semibold text-pink mb-4">
                  <Sparkles className="h-3 w-3" />
                  LIT 부원 전용 MSA 챌린지
                </span>
                <h3 className="font-display text-xl font-bold text-fg sm:text-2xl tracking-tight">
                  부원 계정으로 로그인하고 챌린지에 참여하세요
                </h3>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => onOpenAuth?.('login')}
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))] px-6 py-3 text-xs font-bold text-bg shadow-lg shadow-pink/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <LogIn className="h-4 w-4" />
                    부원 로그인하기
                  </button>
                  <button
                    onClick={() => onOpenAuth?.('register')}
                    className="glass inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-fg hover:border-white/30 hover:bg-white/10 transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    신규 부원 등록
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.25} className="mt-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface/75 p-4.5 sm:p-7 md:p-9 backdrop-blur-xl shadow-2xl transition-colors hover:border-white/[0.14]">
              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                {/* User Info & Status */}
                <div className="flex flex-1 items-start gap-4 sm:gap-6">
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="h-16 w-16 rounded-2xl border-2 border-line object-cover sm:h-20 sm:w-20"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface border border-line text-xs">
                      {isFinished ? '👑' : nextMilestone.icon}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
                        {currentUser.name}
                      </span>
                      <span className="font-mono text-xs text-muted">@{currentUser.handle}</span>
                      {currentUser.certifications && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan">
                          <Award className="h-3 w-3 text-cyan" />
                          {currentUser.certifications}
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs text-muted sm:text-sm">{currentUser.major} · {currentUser.bio}</p>

                    {/* Active Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {currentUser.badges && currentUser.badges.length > 0 ? (
                        currentUser.badges.map((b) => (
                          <span
                            key={b}
                            className="inline-flex items-center gap-1 rounded-md border border-line bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-fg/80"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-amber" />
                            {b}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted">아직 달성한 뱃지가 없습니다. 첫 30 클릭에 도전하세요!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Switch / Edit Profile Buttons */}
                <div className="flex items-center gap-2 self-start lg:self-center">
                  <button
                    onClick={onOpenProfile}
                    className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-muted transition-colors hover:border-white/30 hover:text-fg"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    프로필 수정
                  </button>
                  <button
                    onClick={onOpenAuth}
                    className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-muted transition-colors hover:border-white/30 hover:text-fg"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    부원 전환
                  </button>
                </div>
              </div>

              {/* Progress Bar & Quick Increments */}
              <div className="relative mt-8 border-t border-line/70 pt-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2 whitespace-nowrap">
                      <div className="relative inline-flex items-baseline">
                        <span className="font-sans text-4xl font-black tracking-tight text-fg sm:text-5xl">
                          {myClicks}
                        </span>
                        <AnimatePresence>
                          {justAdded && (
                            <motion.span
                              initial={{ opacity: 0, y: 5, scale: 0.8 }}
                              animate={{ opacity: 1, y: -18, scale: 1.1 }}
                              exit={{ opacity: 0, y: -28 }}
                              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                              className="absolute -top-1 left-full ml-1 font-mono text-sm font-bold text-pink pointer-events-none drop-shadow-[0_0_8px_rgba(255,111,177,0.8)]"
                            >
                              {justAdded}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      <span className="font-mono text-base sm:text-lg text-muted whitespace-nowrap shrink-0">
                        / {targetClicks} 조회수
                      </span>

                      <span className="rounded-full bg-mint/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-mint whitespace-nowrap shrink-0">
                        {progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Quick Increment buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {[1, 5, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleQuickAdd(num)}
                        className="glass group flex h-8.5 items-center gap-1 rounded-xl px-2.5 sm:px-3 text-xs font-semibold text-fg transition-all active:scale-95 hover:border-pink/50 hover:bg-pink/15 shrink-0"
                      >
                        <Plus className="h-3 w-3 text-pink group-hover:scale-125 transition-transform" />
                        +{num}
                      </button>
                    ))}
                    <button
                      onClick={onOpenProfile}
                      className="glass h-8.5 rounded-xl px-2.5 sm:px-3 text-xs text-muted hover:text-fg hover:border-white/30 shrink-0"
                    >
                      직접 입력
                    </button>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="mt-5 relative h-3.5 w-full overflow-hidden rounded-full bg-white/[0.06] p-0.5">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-pink),var(--color-violet),var(--color-mint))]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                  {/* Milestones pin indicators (마지막 목표는 바의 끝점이므로 중간 분할 핀에서 제외하여 모서리 잘림 방지) */}
                  {milestones.filter((ml) => ml.count < targetClicks).map((ml) => {
                    const pos = (ml.count / targetClicks) * 100
                    const achieved = myClicks >= ml.count
                    return (
                      <div
                        key={ml.count}
                        style={{ left: `${pos}%` }}
                        className="absolute top-0 -translate-x-1/2 h-full flex items-center pointer-events-none"
                        title={`${ml.title} (${ml.count} 조회수)`}
                      >
                        <div
                          className={`h-4 w-1 rounded-full ${
                            achieved ? 'bg-white shadow-[0_0_8px_#5ef0d6]' : 'bg-white/20'
                          }`}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Milestone numbers underneath positioned at exact matching percentages */}
                <div className="relative mt-2.5 h-5 w-full font-mono text-[10px] text-muted select-none">
                  {/* 0 Start */}
                  <span className="absolute left-0 top-0 text-muted/70">0</span>

                  {milestones.map((ml, idx) => {
                    const pos = (ml.count / targetClicks) * 100
                    const isLast = idx === milestones.length - 1
                    const achieved = myClicks >= ml.count

                    return (
                      <div
                        key={ml.count}
                        style={{ left: `${pos}%` }}
                        className={`absolute top-0 whitespace-nowrap transition-colors ${
                          isLast
                            ? '-translate-x-full pr-0.5 text-right'
                            : '-translate-x-1/2 text-center'
                        } ${achieved ? 'text-fg font-semibold' : 'text-muted/70'}`}
                      >
                        <span className={isLast ? 'text-amber font-bold' : ''}>
                          {ml.count}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Contributor ID & My Articles Action Bar (글로우 제거 및 깔끔한 다크 글래스 박스) */}
                <div className="mt-6 flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between rounded-2xl bg-surface/60 border border-line p-3.5 sm:p-4 md:px-5 md:py-4 transition-all hover:border-white/20">
                  <div
                    onClick={handleCopyLink}
                    role="button"
                    tabIndex={0}
                    title="클릭하여 내 기본 챌린지 링크 복사"
                    className="group cursor-pointer select-none min-w-0"
                  >
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                      Contributor ID
                      {copied && <span className="text-mint font-sans font-bold normal-case text-[10px]">· 기본 링크 복사됨!</span>}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-bold tracking-tight text-muted transition-colors group-hover:text-fg truncate block mt-0.5">
                      {myContributorId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full lg:w-auto lg:flex lg:items-center">
                    <button
                      type="button"
                      onClick={() => setIsUrlGenOpen((v) => !v)}
                      className="group inline-flex h-11 w-full lg:w-36 xl:w-40 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-white/15 bg-white/10 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-fg transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted group-hover:text-fg transition-colors" />
                      <span className="truncate">URL 생성기</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFilterAuthor(currentUser.handle)}
                      className="group inline-flex h-11 w-full lg:w-36 xl:w-40 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-white/15 bg-white/10 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-fg transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="truncate">내가 쓴 글 보기</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted group-hover:text-fg transition-transform duration-300 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>

                {/* MS Learn Contributor URL Generator Tool */}
                <AnimatePresence>
                  {isUrlGenOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3.5 rounded-2xl border border-white/10 bg-surface/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
                        <div className="border-b border-line/60 pb-3 mb-3">
                          <h4 className="text-sm font-bold text-fg">
                            MS Learn URL 생성기
                          </h4>
                          <p className="text-xs text-muted mt-0.5">
                            Contributor ID가 연결된 URL을 생성해 줍니다.
                          </p>
                        </div>


                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                          <span className="text-xs text-muted font-mono mr-1">예시:</span>
                          {samplePresets.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setInputLearnUrl(preset.url)}
                              className="rounded-lg border border-line bg-white/[0.03] px-2.5 py-1 text-xs text-muted hover:text-fg hover:border-mint/40 hover:bg-white/[0.06] transition-colors"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        {/* Input Box */}
                        <div className="relative">
                          <input
                            type="text"
                            value={inputLearnUrl}
                            onChange={(e) => setInputLearnUrl(e.target.value)}
                            placeholder="MS Learn 링크 붙여넣기 (예: https://learn.microsoft.com/...)"
                            className="glass w-full rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-fg placeholder:text-muted/60 focus:border-mint/50 focus:outline-none"
                          />
                          {inputLearnUrl && (
                            <button
                              type="button"
                              onClick={() => setInputLearnUrl('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg p-1"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Error Notice */}
                        {inputLearnUrl.trim() && urlError && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 flex items-start gap-2.5 rounded-xl border border-pink/30 bg-pink/10 p-3 text-xs text-pink shadow-md"
                          >
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-pink" />
                            <div className="leading-relaxed">
                              <p className="font-semibold">{urlError}</p>
                              <p className="text-[11px] text-pink/80 mt-0.5">
                                가이드 지침에 부합하는 적격 Microsoft 콘텐츠 링크를 입력해 주세요.
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Output Box */}
                        {generatedUrl && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 rounded-xl border border-mint/30 bg-black/40 p-3"
                          >
                            <div className="break-all font-mono text-xs text-fg/95 bg-surface/90 border border-line rounded-lg p-2.5 select-all leading-relaxed">
                              {generatedUrl}
                            </div>

                            <div className="mt-2.5 flex items-center justify-end gap-2">
                              <a
                                href={generatedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="glass inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-muted hover:text-fg hover:border-white/30 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>열기</span>
                              </a>

                              <button
                                type="button"
                                onClick={handleCopyGenUrl}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-3.5 py-1.5 text-xs font-bold text-bg hover:bg-mint/90 transition-all shadow-md shadow-mint/15 active:scale-95"
                              >
                                {copiedGenUrl ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>복사 완료!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>링크 복사</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

