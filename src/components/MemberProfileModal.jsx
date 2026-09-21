import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  BookOpen,
  ChevronRight,
  Copy,
  Check,
  Edit3,
  ExternalLink,
  Flame,
  Globe,
  Lock,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  X,
} from 'lucide-react'
import Modal from './ui/Modal.jsx'
import { storageService, extractContributorId } from '../services/storageService.js'

export default function MemberProfileModal({
  isOpen,
  onClose,
  member = null,
  onOpenEdit = null,
  onFilterAuthor = null,
}) {
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())
  const [articles, setArticles] = useState(storageService.getArticles())
  const [milestones, setMilestones] = useState(storageService.getMilestones())
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser())
      setIsAdmin(storageService.isAdmin())
      setArticles(storageService.getArticles())
      setMilestones(storageService.getMilestones())
    })
    return unsub
  }, [])

  if (!isOpen || !member) return null

  // 활성 부원 데이터 동기화
  const currentMember = storageService.getMember(member.handle) || member
  const isOwner = currentUser && currentMember && currentUser.handle?.toLowerCase() === currentMember.handle?.toLowerCase()
  const canEdit = isOwner || isAdmin

  // 통계 계산
  const clicks = currentMember.clicks || 0
  const targetClicks = milestones.length > 0 ? milestones[milestones.length - 1].count : 250
  const progressPercent = Math.min(100, Math.round((clicks / targetClicks) * 100))
  const isFinished = clicks >= targetClicks
  const nextMilestone = milestones.find((m) => m.count > clicks) || milestones[milestones.length - 1]
  const clicksLeft = isFinished ? 0 : (nextMilestone?.count || 250) - clicks

  // 이 부원이 작성한 아티클 목록
  const memberArticles = articles.filter(
    (a) => (a.authorHandle || '').toLowerCase() === (currentMember.handle || '').toLowerCase()
  )

  // 소셜 및 외부 링크 정리
  const socialEntries = Object.entries(currentMember.socials || {}).filter(
    ([, url]) => url && typeof url === 'string' && url.trim().length > 0
  )
  const customLinks = Array.isArray(currentMember.links) ? currentMember.links.filter((l) => l.url) : []

  const handleCopyContributorUrl = () => {
    if (!currentMember.msLink) return
    navigator.clipboard.writeText(currentMember.msLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleViewArticles = () => {
    onClose()
    if (onFilterAuthor) {
      onFilterAuthor(currentMember.handle)
    }
  }

  return (
    <Modal>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="modal-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-surface/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-line/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-mint shadow-[0_0_8px_#5ef0d6]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              {isOwner ? '내 프로필' : '부원 상세 프로필'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenEdit(currentMember)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-pink/40 bg-pink/15 px-3 py-1.5 text-xs font-bold text-pink transition-all hover:bg-pink/25 hover:border-pink shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isOwner ? '프로필 수정' : '부원 정보 관리'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-fg"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Member Profile Hero */}
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="relative shrink-0">
            <img
              src={currentMember.avatar}
              alt={currentMember.name}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl sm:rounded-3xl border-2 border-mint/40 object-cover shadow-xl"
            />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-sm shadow-md">
              {isFinished ? '👑' : nextMilestone?.icon || '🌱'}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-fg">
                {currentMember.name}
              </h2>
              <span className="font-mono text-xs text-mint">@{currentMember.handle}</span>
              {(currentMember.handle === 'LIT' || currentMember.role?.includes('회장') || currentMember.role?.includes('운영진')) && (
                <span className="inline-flex items-center gap-1 rounded-md border border-pink/40 bg-pink/15 px-2 py-0.5 font-mono text-[10px] font-bold text-pink">
                  <ShieldCheck className="h-3 w-3" />
                  운영진
                </span>
              )}
            </div>

            <p className="mt-1.5 text-xs sm:text-sm text-muted">
              {[currentMember.role, currentMember.major].filter(Boolean).join(' · ') || 'LIT 부원'}
            </p>

            {/* Bio */}
            <div className="mt-3 rounded-xl border border-line/60 bg-white/[0.03] p-3">
              <p className="text-xs sm:text-sm leading-relaxed text-fg/90 whitespace-pre-wrap">
                {currentMember.bio || '아직 작성된 한줄 소개가 없습니다.'}
              </p>
            </div>

            {/* Social & Custom External Links */}
            {(socialEntries.length > 0 || customLinks.length > 0) && (
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                {socialEntries.map(([platform, url]) => {
                  const href = url.startsWith('http') ? url : `https://${url}`
                  return (
                    <a
                      key={platform}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-fg/80 transition-all hover:text-mint hover:border-mint/50"
                    >
                      <Globe className="h-3 w-3 text-muted" />
                      <span className="capitalize">{platform}</span>
                      <ExternalLink className="h-2.5 w-2.5 text-muted" />
                    </a>
                  )
                })}
                {customLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-fg/80 transition-all hover:text-mint hover:border-mint/50"
                  >
                    <ExternalLink className="h-3 w-3 text-mint" />
                    <span>{link.name || link.platform || '링크'}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4 Metrics Grid */}
        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-2xl border border-line/80 bg-white/[0.03] p-3.5 sm:p-4">
            <span className="font-mono text-[10px] uppercase text-muted">현재 조회수</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-sans text-2xl sm:text-3xl font-black text-fg">{clicks}</span>
              <span className="font-mono text-[11px] text-muted">/ {targetClicks}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line/80 bg-white/[0.03] p-3.5 sm:p-4">
            <span className="font-mono text-[10px] uppercase text-muted">목표 달성률</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-sans text-2xl sm:text-3xl font-black text-mint">{progressPercent}%</span>
              {isFinished && <span className="text-xs">👑</span>}
            </div>
          </div>

          <div className="rounded-2xl border border-line/80 bg-white/[0.03] p-3.5 sm:p-4">
            <span className="font-mono text-[10px] uppercase text-muted">달성 배지</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-sans text-2xl sm:text-3xl font-black text-pink">
                {currentMember.badges?.length || 0}
              </span>
              <span className="font-mono text-[11px] text-muted">개</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line/80 bg-white/[0.03] p-3.5 sm:p-4">
            <span className="font-mono text-[10px] uppercase text-muted">보유 자격증</span>
            <div className="mt-1 truncate font-display text-sm sm:text-base font-bold text-cyan" title={currentMember.certifications || '도전 중'}>
              {currentMember.certifications || '도전 중'}
            </div>
          </div>
        </div>

        {/* Progress Bar & Next Goal */}
        <div className="mt-5 rounded-2xl border border-line/80 bg-surface/70 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-fg">
              <Sparkles className="h-3.5 w-3.5 text-amber" />
              <span>
                {isFinished
                  ? '최종 250 달성 완료! 👑'
                  : `다음 목표 (${nextMilestone?.title || ''})까지 ${clicksLeft} 조회수 남음`}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-mint">{progressPercent}%</span>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isFinished
                  ? 'bg-mint shadow-[0_0_8px_rgba(94,240,214,0.6)]'
                  : 'bg-[linear-gradient(90deg,var(--color-pink),var(--color-violet),var(--color-mint))]'
              }`}
            />
          </div>

          {/* Achieved Milestones Badges List */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {milestones.map((ml) => {
              const achieved = clicks >= ml.count
              return (
                <span
                  key={ml.count}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold transition-all ${
                    achieved
                      ? 'border border-white/20 bg-white/10 text-fg shadow-sm'
                      : 'border border-line/40 bg-white/[0.02] text-muted/50'
                  }`}
                >
                  <span>{ml.icon}</span>
                  <span>{ml.title}</span>
                  {achieved && <Check className="h-2.5 w-2.5 text-mint ml-0.5" />}
                </span>
              )
            })}
          </div>
        </div>

        {/* Action Card: Feed Articles Link & (if owner) Contributor Link Copy */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleViewArticles}
            className="flex-1 flex items-center justify-between rounded-2xl border border-line bg-white/[0.04] p-4 text-left transition-all hover:bg-white/[0.08] hover:border-mint/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/5 text-mint group-hover:scale-105 transition-transform">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-fg group-hover:text-mint transition-colors">
                  이 부원이 공유한 피드 글
                </h4>
                <p className="text-xs text-muted">
                  총 {memberArticles.length}개의 아티클이 등록되어 있습니다.
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted group-hover:translate-x-1 group-hover:text-fg transition-all" />
          </button>

          {/* Owner Contributor Link Copy */}
          {isOwner && currentMember.msLink && (
            <button
              type="button"
              onClick={handleCopyContributorUrl}
              className="glass flex items-center justify-between gap-3 rounded-2xl p-4 text-left transition-all hover:border-pink/50 hover:bg-pink/10 sm:max-w-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink/20 text-pink">
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-fg">
                    {copiedLink ? '복사 완료!' : '내 MS Learn 링크'}
                  </div>
                  <div className="font-mono text-[10px] text-muted truncate max-w-[120px]">
                    {currentMember.contributorId || 'ID 복사'}
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>
      </motion.div>
    </Modal>
  )
}

