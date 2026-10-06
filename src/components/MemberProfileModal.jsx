import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  ChevronRight,
  Copy,
  Check,
  Edit3,
  ExternalLink,
  FileText,
  Flame,
  Github,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  Lock,
  LogOut,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Twitter,
  User,
  Camera,
  Mail,
  X,
  Youtube,
} from 'lucide-react'
import Modal from './ui/Modal.jsx'
import MemberAvatarBadge, { MemberNameBadge } from './ui/MemberAvatarBadge.jsx'
import VerifyClicksModal from './VerifyClicksModal.jsx'
import {
  storageService,
  extractContributorId,
  formatContributorLink,
  validateAndGenerateContributorUrl,
} from '../services/storageService.js'

export function detectPlatform(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { platform: 'custom', name: '웹사이트', color: '#5EF0D6', type: 'web' }
  }
  const clean = rawUrl.trim().toLowerCase()

  if (clean.includes('linkedin.com')) {
    return { platform: 'linkedin', name: 'LinkedIn', color: '#0A66C2', type: 'sns' }
  }
  if (clean.includes('github.com')) {
    return { platform: 'github', name: 'GitHub', color: '#FFFFFF', type: 'code' }
  }
  if (clean.includes('velog.io')) {
    return { platform: 'velog', name: 'Velog', color: '#20C997', type: 'blog' }
  }
  if (clean.includes('tistory.com')) {
    return { platform: 'tistory', name: 'Tistory', color: '#FF5722', type: 'blog' }
  }
  if (clean.includes('notion.so') || clean.includes('notion.site')) {
    return { platform: 'notion', name: 'Notion', color: '#F59E0B', type: 'doc' }
  }
  if (clean.includes('medium.com')) {
    return { platform: 'medium', name: 'Medium', color: '#FFFFFF', type: 'blog' }
  }
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
    return { platform: 'youtube', name: 'YouTube', color: '#FF0000', type: 'video' }
  }
  if (clean.includes('instagram.com')) {
    return { platform: 'instagram', name: 'Instagram', color: '#E1306C', type: 'sns' }
  }
  if (clean.includes('twitter.com') || clean.includes('x.com')) {
    return { platform: 'twitter', name: 'X (Twitter)', color: '#1DA1F2', type: 'sns' }
  }

  // Fallback: extract domain name
  try {
    const u = new URL(clean.startsWith('http') ? clean : `https://${clean}`)
    const host = u.hostname.replace(/^www\./, '')
    const domainPart = host.split('.')[0]
    const capitalized = domainPart.charAt(0).toUpperCase() + domainPart.slice(1)
    return { platform: 'custom', name: capitalized || '웹사이트', color: '#5EF0D6', type: 'web' }
  } catch (e) {
    return { platform: 'custom', name: '웹사이트', color: '#5EF0D6', type: 'web' }
  }
}

export function renderPlatformIcon(platform, className = 'h-4 w-4') {
  switch (platform) {
    case 'linkedin':
      return <Linkedin className={`${className} text-[#0A66C2]`} />
    case 'github':
      return <Github className={`${className} text-fg`} />
    case 'velog':
      return <BookOpen className={`${className} text-[#20C997]`} />
    case 'tistory':
      return <BookOpen className={`${className} text-[#FF5722]`} />
    case 'medium':
      return <BookOpen className={`${className} text-fg`} />
    case 'notion':
      return <FileText className={`${className} text-[#F59E0B]`} />
    case 'youtube':
      return <Youtube className={`${className} text-[#FF0000]`} />
    case 'instagram':
      return <Instagram className={`${className} text-[#E1306C]`} />
    case 'twitter':
      return <Twitter className={`${className} text-[#1DA1F2]`} />
    default:
      return <Globe className={`${className} text-mint`} />
  }
}

function getDisplayUrl(rawUrl) {
  if (!rawUrl) return ''
  try {
    const decoded = decodeURIComponent(rawUrl)
    const parsed = new URL(decoded.startsWith('http') ? decoded : `https://${decoded}`)
    return decodeURIComponent(parsed.hostname.replace(/^www\./, '') + (parsed.pathname !== '/' ? parsed.pathname : ''))
  } catch (e) {
    try {
      return decodeURIComponent(rawUrl.replace(/^https?:\/\/(www\.)?/, ''))
    } catch {
      return rawUrl.replace(/^https?:\/\/(www\.)?/, '')
    }
  }
}

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
  const [justAdded, setJustAdded] = useState(null)

  // 프로필 링크 관리 상태
  const [isEditingLinks, setIsEditingLinks] = useState(false)
  const [editableLinks, setEditableLinks] = useState([])
  const [isSavingLinks, setIsSavingLinks] = useState(false)

  // MS Learn Contributor URL 생성기 상태
  const [isUrlGenOpen, setIsUrlGenOpen] = useState(false)
  const [inputLearnUrl, setInputLearnUrl] = useState('')
  const [copiedGenUrl, setCopiedGenUrl] = useState(false)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [directClicksVal, setDirectClicksVal] = useState('')
  const [directSaved, setDirectSaved] = useState(false)
  const [noArticlesNotice, setNoArticlesNotice] = useState(false)

  const samplePresets = [
    { label: 'Azure AI 기초', url: 'https://learn.microsoft.com/training/modules/get-started-with-ai-in-azure/' },
    { label: 'GitHub Copilot', url: 'https://learn.microsoft.com/training/modules/get-started-github-copilot/?practice-assessment-type=certification' },
    { label: 'Fabric 기초', url: 'https://learn.microsoft.com/training/paths/get-started-fabric/' },
  ]

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser())
      setIsAdmin(storageService.isAdmin())
      setArticles(storageService.getArticles())
      setMilestones(storageService.getMilestones())
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setIsEditingLinks(false)
      setIsUrlGenOpen(false)
      setNoArticlesNotice(false)
    } else if (member) {
      const mem = storageService.getMember(member.handle) || member
      setDirectClicksVal(mem?.clicks ?? 0)
    }
  }, [isOpen, member])

  if (!isOpen || !member) return null

  // 활성 부원 데이터 동기화
  const currentMember = storageService.getMember(member.handle) || member
  const isAdminAccount = currentMember.handle?.toUpperCase() === 'LIT'
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

  // Contributor ID 및 URL 검증
  const rawId = (currentMember.contributorId || '').trim()
  const isDefaultAdminId =
    currentMember.handle !== 'tlgjs' &&
    currentMember.handle !== 'LIT' &&
    (rawId.includes('482865') || (currentMember.msLink || '').includes('482865'))
  const memberContributorId = isDefaultAdminId ? '' : rawId
  const urlValidation = validateAndGenerateContributorUrl(inputLearnUrl, memberContributorId)
  const generatedUrl = urlValidation.isValid ? urlValidation.url : ''
  const urlError = urlValidation.error

  // PR 및 외부 링크 정리 (Linktree)
  const prLinks = (() => {
    if (Array.isArray(currentMember.links) && currentMember.links.length > 0) {
      return currentMember.links
        .filter((l) => l && l.url && l.url.trim())
        .map((l, i) => ({
          id: l.id || `pr-${i}`,
          title: l.title || l.name || l.platform || '링크',
          url: l.url.trim(),
        }))
    }
    const legacy = []
    if (currentMember.socials?.linkedin) {
      legacy.push({ id: 's-linkedin', title: 'LinkedIn', url: currentMember.socials.linkedin })
    }
    if (currentMember.socials?.github) {
      legacy.push({ id: 's-github', title: 'GitHub', url: currentMember.socials.github })
    }
    if (currentMember.socials?.blog) {
      legacy.push({ id: 's-blog', title: '기술 블로그', url: currentMember.socials.blog })
    }
    return legacy
  })()

  const handleOpenLinkEdit = () => {
    const list = prLinks.map((l) => ({
      id: l.id || `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: l.title || '',
      url: l.url || '',
    }))
    if (list.length === 0) {
      list.push({ id: `link-${Date.now()}`, title: '', url: '' })
    }
    setEditableLinks(list)
    setIsEditingLinks(true)
  }

  const handleAddNewLink = (defaultTitle = '', defaultUrl = '') => {
    setEditableLinks((prev) => [
      ...prev,
      {
        id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: defaultTitle,
        url: defaultUrl,
      },
    ])
  }

  const handleLinkUrlChange = (idx, newUrl) => {
    setEditableLinks((prev) => {
      const updated = [...prev]
      const detected = detectPlatform(newUrl)
      const currentItem = updated[idx]
      const prevDetected = detectPlatform(currentItem.url)
      const titleWasEmptyOrAuto =
        !currentItem.title ||
        currentItem.title === prevDetected.name ||
        currentItem.isAutoTitle

      updated[idx] = {
        ...currentItem,
        url: newUrl,
        title: titleWasEmptyOrAuto && newUrl ? detected.name : currentItem.title,
        isAutoTitle: titleWasEmptyOrAuto && !!newUrl,
      }
      return updated
    })
  }

  const handleLinkTitleChange = (idx, newTitle) => {
    setEditableLinks((prev) => {
      const updated = [...prev]
      updated[idx] = {
        ...updated[idx],
        title: newTitle,
        isAutoTitle: false,
      }
      return updated
    })
  }

  const handleRemoveLinkRow = (idx) => {
    setEditableLinks((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSaveLinks = async () => {
    setIsSavingLinks(true)
    try {
      const validLinks = editableLinks
        .filter((l) => l.url && l.url.trim().length > 0)
        .map((l) => {
          const detected = detectPlatform(l.url)
          return {
            id: l.id || `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: (l.title || detected.name || '링크').trim(),
            url: l.url.trim(),
          }
        })

      await storageService.updateMemberProfile(currentMember.handle, {
        links: validLinks,
      })
      setIsEditingLinks(false)
    } catch (err) {
      alert(`링크 저장 중 오류가 발생했습니다: ${err.message}`)
    } finally {
      setIsSavingLinks(false)
    }
  }

  const handleCopyContributorUrl = () => {
    const link = (!isDefaultAdminId && currentMember.msLink) ? currentMember.msLink : (memberContributorId ? formatContributorLink(memberContributorId) : '')
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyGenUrl = () => {
    if (!generatedUrl) return
    navigator.clipboard.writeText(generatedUrl)
    setCopiedGenUrl(true)
    setTimeout(() => setCopiedGenUrl(false), 2000)
  }

  const handleSaveDirectClicks = async () => {
    if (!canEdit || !currentMember) return
    const num = Math.max(0, parseInt(directClicksVal, 10) || 0)
    await storageService.updateMemberClicks(currentMember.handle, num, true)
    setDirectSaved(true)
    setTimeout(() => setDirectSaved(false), 1200)
  }

  const handleQuickAdd = async (amount) => {
    if (!canEdit) return
    await storageService.updateMemberClicks(currentMember.handle, amount)
    setJustAdded(`+${amount}`)
    setTimeout(() => setJustAdded(null), 1200)
  }

  const handleViewArticles = () => {
    if (memberArticles.length === 0) {
      setNoArticlesNotice(true)
      setTimeout(() => setNoArticlesNotice(false), 3500)
      return
    }
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
        data-lenis-prevent
        className="modal-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-surface/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
      >
        {/* Top bar */}
        <div className="flex items-center justify-end border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  storageService.logout()
                  onClose()
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-fg/90 hover:text-fg hover:border-white/20 hover:bg-white/10 transition-all shadow-sm"
                title="현재 계정 로그아웃"
              >
                <LogOut className="h-3.5 w-3.5 text-muted" />
                <span>로그아웃</span>
              </button>
            )}
            {canEdit && onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenEdit(currentMember)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-fg/90 hover:text-fg hover:border-white/20 hover:bg-white/10 transition-all shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5 text-muted" />
                <span>{isOwner ? '프로필 수정' : '부원 정보 관리'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-fg ml-1"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Member Profile Hero */}
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="relative shrink-0 self-start">
            <img
              src={currentMember.avatar}
              alt={currentMember.name}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl sm:rounded-3xl border border-line object-cover shadow-xl"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-fg">
                {currentMember.name}
              </h2>
              <div className="inline-flex items-center gap-1.5">
                <span className="text-xs text-muted/70">@{currentMember.handle}</span>
                <MemberNameBadge member={currentMember} size="sm" />
              </div>
            </div>

            <p className="mt-1.5 text-xs sm:text-sm text-muted/80">
              {[currentMember.role, currentMember.major].filter(Boolean).join(' · ') || 'LIT 부원'}
            </p>

            {/* Bio */}
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className={`text-xs sm:text-sm leading-relaxed ${currentMember.bio ? 'text-fg/90' : 'text-muted/50 italic'} whitespace-pre-wrap`}>
                {currentMember.bio || '아직 작성된 한줄 소개가 없습니다.'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Links Section (프로필 링크) */}
        {(prLinks.length > 0 || canEdit) && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-muted">
                  <Link2 className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted/80">
                  {isEditingLinks ? '프로필 링크 관리' : '프로필 링크'}
                </h3>
                {!isEditingLinks && prLinks.length > 0 && (
                  <span className="rounded-full bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] text-muted font-medium">
                    {prLinks.length}
                  </span>
                )}
              </div>

              {canEdit && !isEditingLinks && (
                <button
                  type="button"
                  onClick={handleOpenLinkEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-2.5 py-1 text-xs font-medium text-fg/80 hover:text-fg transition-all shadow-sm"
                >
                  <Edit3 className="h-3 w-3 text-muted" />
                  <span>링크 관리</span>
                </button>
              )}

              {canEdit && isEditingLinks && (
                <button
                  type="button"
                  onClick={() => handleAddNewLink()}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-fg hover:bg-white/15 transition-all shadow-sm"
                >
                  <Plus className="h-3 w-3" />
                  <span>새 링크</span>
                </button>
              )}
            </div>

            {/* Editing Mode */}
            {isEditingLinks ? (
              <div className="space-y-3">
                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    { label: 'LinkedIn', url: 'https://linkedin.com/in/' },
                    { label: 'GitHub', url: 'https://github.com/' },
                    { label: 'Velog', url: 'https://velog.io/@' },
                    { label: 'Notion', url: 'https://notion.so/' },
                    { label: '포트폴리오', url: '' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleAddNewLink(preset.label, preset.url)}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted hover:border-white/30 hover:text-fg hover:bg-white/[0.08] transition-colors"
                    >
                      +{preset.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5 mt-2">
                  {editableLinks.map((link, idx) => {
                    const detected = detectPlatform(link.url)
                    return (
                      <div
                        key={link.id || idx}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 sm:p-3 transition-colors hover:border-white/20"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.05] border border-white/10 shrink-0">
                              {renderPlatformIcon(detected.platform, 'h-3.5 w-3.5')}
                            </span>
                            <span className="text-[11px] font-medium text-muted px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] truncate">
                              {link.url ? `${detected.name} 인식됨` : '플랫폼 자동 인식'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveLinkRow(idx)}
                            className="p-1 rounded-lg text-muted hover:text-pink hover:bg-pink/10 transition-colors"
                            title="링크 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => handleLinkUrlChange(idx, e.target.value)}
                            placeholder="링크 URL 붙여넣기 (예: https://...)"
                            className="glass flex-1 rounded-xl px-3 py-1.5 text-xs text-fg focus:border-white/30 focus:outline-none min-w-0"
                          />
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => handleLinkTitleChange(idx, e.target.value)}
                            placeholder={detected.name || '링크 제목 (선택)'}
                            className="glass sm:w-36 rounded-xl px-3 py-1.5 text-xs text-fg focus:border-white/30 focus:outline-none"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {editableLinks.length === 0 && (
                  <div className="py-4 text-center text-xs text-muted/60">
                    등록된 링크가 없습니다. 위 버튼이나 [새 링크]를 눌러 링크를 추가해보세요.
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditingLinks(false)}
                    className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs text-muted hover:text-fg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={isSavingLinks}
                    onClick={handleSaveLinks}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-mint/30 bg-mint/15 hover:bg-mint/25 px-4 py-1.5 text-xs font-semibold text-mint transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{isSavingLinks ? '저장 중...' : '저장 완료'}</span>
                  </button>
                </div>
              </div>
            ) : prLinks.length > 0 ? (
              /* View Mode with Links */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {prLinks.map((link, idx) => {
                  const detected = detectPlatform(link.url)
                  const href = link.url.startsWith('http') ? link.url : `https://${link.url}`
                  let displayTitle = link.title || detected.name || '링크'
                  try {
                    displayTitle = decodeURIComponent(displayTitle)
                  } catch {}

                  return (
                    <a
                      key={link.id || idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:px-3.5 sm:py-3 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06] hover:scale-[1.01] shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-muted group-hover:text-fg group-hover:border-white/20 transition-colors">
                          {renderPlatformIcon(detected.platform, 'h-4 w-4')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-xs sm:text-sm text-fg group-hover:text-fg transition-colors truncate">
                              {displayTitle}
                            </p>
                            {detected.platform !== 'custom' && link.title && link.title.toLowerCase() !== detected.name.toLowerCase() && (
                              <span className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-muted/80 font-medium shrink-0">
                                {detected.name}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted/70 truncate mt-0.5">
                            {getDisplayUrl(link.url)}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted/60 transition-all duration-200 group-hover:text-fg group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  )
                })}
              </div>
            ) : (
              /* View Mode Empty */
              <div className="flex flex-col items-center justify-center py-5 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                <Link2 className="h-6 w-6 text-muted/40 mb-1.5" />
                <p className="text-xs text-muted">등록된 프로필 링크가 없습니다.</p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleOpenLinkEdit}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-medium text-fg/90 transition-all shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>프로필 링크 추가하기</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {isAdminAccount ? (
          /* LIT 운영진 전용 공식 관리 정보 카드 */
          <div className="mt-5 rounded-2xl border border-[#3182F6]/25 bg-[#3182F6]/[0.04] p-5 backdrop-blur-sm shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#3182F6]/30 bg-[#3182F6]/15 text-[#3182F6] shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-fg">LIT 공식 운영 관리국</h4>
                    <span className="rounded-full border border-[#3182F6]/30 bg-[#3182F6]/15 px-2 py-0.5 text-[10px] font-semibold text-[#3182F6]">
                      Official Admin
                    </span>
                  </div>
                  <p className="text-xs text-muted/80 mt-0.5">
                    동아리 공식 채널 및 챌린지 전반을 총괄하는 운영진 공식 계정입니다.
                  </p>
                </div>
              </div>

              {memberArticles.length > 0 && (
                <div className="self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={handleViewArticles}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-3.5 text-xs font-medium text-fg/90 hover:text-fg transition-all active:scale-[0.98]"
                  >
                    <span>운영진 작성 글 ({memberArticles.length})</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted hover:text-fg" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar & Milestones */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                  <div className="relative inline-flex items-baseline">
                    <span className="font-sans text-2xl sm:text-4xl font-black tracking-tight text-fg">
                      {clicks}
                    </span>
                    <AnimatePresence>
                      {justAdded && (
                        <motion.span
                          initial={{ opacity: 0, y: 5, scale: 0.8 }}
                          animate={{ opacity: 1, y: -16, scale: 1.1 }}
                          exit={{ opacity: 0, y: -24 }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute -top-1 left-full ml-1 text-xs sm:text-sm font-bold text-pink pointer-events-none drop-shadow-[0_0_8px_rgba(255,111,177,0.8)]"
                        >
                          {justAdded}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <span className="text-xs sm:text-base text-muted/70 whitespace-nowrap shrink-0">
                    / {targetClicks} 조회수
                  </span>

                  <span className="rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-mint whitespace-nowrap shrink-0">
                    {progressPercent}%
                  </span>
                </div>

                {/* Clicks Adjustment / Verification Buttons */}
                {canEdit && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* 1. 클릭수 수정 버튼 (인증) */}
                    <button
                      type="button"
                      onClick={() => setIsVerifyModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/90 hover:bg-surface px-3 py-1.5 text-xs font-semibold text-fg transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer"
                      title="메일 캡처로 클릭수 수정"
                    >
                      <Camera className="h-3.5 w-3.5 text-[#3182F6]" />
                      <span>수정</span>
                    </button>
                  </div>
                )}
              </div>

          {/* 2. 관리자(Admin) 전용 클릭수 직접 조정 (서브 행) */}
          {canEdit && isAdmin && (
            <div className="mt-2.5 flex items-center justify-end">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/90 px-2.5 py-1 shadow-xs transition-colors hover:border-line/80 focus-within:border-[#3182F6] focus-within:ring-1 focus-within:ring-[#3182F6]/30">
                <span className="text-[11px] font-bold text-muted/80 shrink-0">직접 수정</span>
                <input
                  type="number"
                  min="0"
                  value={directClicksVal}
                  onChange={(e) => setDirectClicksVal(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDirectClicks()
                  }}
                  className="h-6 w-14 rounded-md border border-line/60 bg-slate-100 dark:bg-white/[0.06] px-1.5 text-center font-sans text-xs font-bold text-fg focus:bg-transparent focus:border-[#3182F6] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveDirectClicks}
                  className={`h-6 px-2.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    directSaved
                      ? 'bg-mint/20 text-mint'
                      : 'bg-[#3182F6] text-white hover:bg-[#2563EB] shadow-xs active:scale-95'
                  }`}
                >
                  <span>{directSaved ? '저장됨' : '적용'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Animated Progress Bar with Milestone Pins */}
          <div className="mt-4 relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06] p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-pink to-mint"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Milestones pin indicators */}
            {milestones.filter((ml) => ml.count < targetClicks).map((ml) => {
              const pos = (ml.count / targetClicks) * 100
              const achieved = clicks >= ml.count
              return (
                <div
                  key={ml.count}
                  style={{ left: `${pos}%` }}
                  className="absolute top-0 -translate-x-1/2 h-full flex items-center pointer-events-none z-10"
                  title={`${ml.title} (${ml.count} 조회수)`}
                >
                  <div
                    className={`h-full w-[1.5px] rounded-full ${
                      achieved ? 'bg-surface/80' : 'bg-white/20'
                    }`}
                  />
                </div>
              )
            })}
          </div>

          {/* Milestone numbers underneath positioned at exact matching percentages */}
          <div className="relative mt-2 h-4 w-full text-[11px] text-muted select-none">
            {/* 0 Start */}
            <span className="absolute left-0 top-0 text-muted/50">0</span>

            {milestones.map((ml, idx) => {
              const pos = (ml.count / targetClicks) * 100
              const isLast = idx === milestones.length - 1
              const achieved = clicks >= ml.count

              return (
                <div
                  key={ml.count}
                  style={{ left: `${pos}%` }}
                  className={`absolute top-0 whitespace-nowrap transition-colors ${
                    isLast
                      ? '-translate-x-full pr-0.5 text-right'
                      : '-translate-x-1/2 text-center'
                  } ${achieved ? 'text-fg font-medium' : 'text-muted/50'}`}
                >
                  <span className={isLast ? 'text-fg font-semibold' : ''}>
                    {ml.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Contributor ID & My Articles Action Bar */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-sm transition-all hover:border-white/20">
          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div
              onClick={handleCopyContributorUrl}
              role="button"
              tabIndex={0}
              title="클릭하여 기본 챌린지 링크 복사"
              className="group cursor-pointer select-none min-w-0"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted/70">
                Contributor ID
                {copiedLink && (
                  <span className="text-mint font-sans font-bold normal-case text-[11px]">
                    · 기본 링크 복사됨!
                  </span>
                )}
              </span>
              <span className="text-sm sm:text-base font-semibold tracking-tight text-fg/90 transition-colors group-hover:text-fg truncate block mt-1">
                {memberContributorId || 'ID 미등록'}
              </span>
            </div>

            <div className="flex flex-col items-stretch sm:items-end w-full sm:w-auto">
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full sm:w-auto sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={() => setIsUrlGenOpen((v) => !v)}
                  className="group inline-flex h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-3.5 text-xs font-medium text-fg/80 hover:text-fg transition-all active:scale-[0.98]"
                >
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-muted group-hover:text-fg transition-colors" />
                  <span className="truncate">URL 생성기</span>
                </button>

                <button
                  type="button"
                  onClick={handleViewArticles}
                  className="group inline-flex h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-3.5 text-xs font-medium text-fg/80 hover:text-fg transition-all active:scale-[0.98]"
                >
                  <span className="truncate">{isOwner ? '내가 쓴 글 보기' : '작성한 글 보기'}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted group-hover:text-fg transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* 작성된 글이 없을 때 안내 문구 */}
              <AnimatePresence>
                {noArticlesNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 w-full text-center sm:text-right"
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      <span>아직 작성한 글이 없습니다.</span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
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
                <div className="mt-3.5 pt-3.5 border-t border-line/60">
                  <div className="mb-3">
                    <h4 className="text-xs sm:text-sm font-bold text-fg">
                      MS Learn URL 생성기
                    </h4>
                    <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                      Contributor ID({memberContributorId || '미등록'})가 연결된 맞춤 링크를 생성합니다.
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
          </>
        )}
      </motion.div>

      {/* MS 공식 메일 AI 인증 모달 */}
      <VerifyClicksModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        member={currentMember}
        onSuccess={() => {
          // Success handled in storageService notify
        }}
      />
    </Modal>
  )
}

