import Modal from './ui/Modal.jsx'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpRight,
  ExternalLink,
  Heart,
  Plus,
  Search,
  Share2,
  Sparkles,
  Tag,
  User,
  X,
  BookOpen,
  Edit3,
  Trash2,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  ChevronDown,
} from 'lucide-react'
import { storageService, generateContributorUrl, AVATAR_PRESETS, compressImage } from '../services/storageService.js'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'
import MagneticButton from './ui/MagneticButton.jsx'

const platformStyles = {
  linkedin: { label: 'LinkedIn', color: 'bg-[#0077b5]/15 text-[#0077b5] border-[#0077b5]/30' },
  velog: { label: 'Velog', color: 'bg-[#20c997]/15 text-[#20c997] border-[#20c997]/30' },
  blog: { label: 'Blog', color: 'bg-amber/15 text-amber border-amber/30' },
  github: { label: 'GitHub', color: 'bg-white/10 text-fg border-white/20' },
  none: { label: '', color: '' },
}

function sanitizeWebUrl(raw) {
  if (!raw) return ''
  const trimmed = String(raw).trim()
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return ''
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

export default function ArticleHub({ authorFilter, onClearAuthorFilter, onFilterAuthor, onOpenAuth, onOpenProfile }) {
  const [articles, setArticles] = useState(storageService.getArticles())
  const [members, setMembers] = useState(storageService.getMembers())
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef(null)
  const [selectedTag, setSelectedTag] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  // 글 작성/수정 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    url: '',
    learnUrl: '',
    imageUrl: '',
    platform: 'linkedin',
    tags: '',
    authorHandle: currentUser?.handle || '',
  })

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setArticles(storageService.getArticles())
      setMembers(storageService.getMembers())
      setCurrentUser(storageService.getCurrentUser())
      setIsAdmin(storageService.isAdmin())
    })
    return unsub
  }, [])

  useEffect(() => {
    if (currentUser && !formData.authorHandle) {
      setFormData((prev) => ({ ...prev, authorHandle: currentUser.handle }))
    }
  }, [currentUser])

  // 전체 태그 수집
  const allTags = ['ALL', ...Array.from(new Set(articles.flatMap((a) => a.tags || [])))]

  // 필터링 적용
  const filteredArticles = articles.filter((a) => {
    // 특정 작성자 필터 (?author=... 또는 내가 쓴 글)
    if (authorFilter && a.authorHandle !== authorFilter) return false

    // 태그 필터
    if (selectedTag !== 'ALL' && !(a.tags || []).includes(selectedTag)) return false

    // 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = a.title.toLowerCase().includes(q)
      const matchExcerpt = (a.excerpt || '').toLowerCase().includes(q)
      const matchAuthor = a.authorName.toLowerCase().includes(q)
      return matchTitle || matchExcerpt || matchAuthor
    }
    return true
  })

  const authorMember = authorFilter ? members.find((m) => m.handle === authorFilter) : null

  // 좋아요 핸들러
  const handleLike = async (e, id) => {
    e.stopPropagation()
    await storageService.toggleArticleLike(id)
  }

  // 대표 이미지 업로드 (최대 30MB 고화질 사진을 Retina 1400px 품질 0.85로 최적화)
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 30 * 1024 * 1024) {
      alert('이미지 파일 크기는 30MB 이하여야 합니다.')
      return
    }
    try {
      const compressed = await compressImage(file, 1200, 0.82)
      setFormData((prev) => ({ ...prev, imageUrl: compressed }))
    } catch (err) {
      alert('이미지 처리 중 오류가 발생했습니다. 다른 사진을 선택해 주세요.')
    }
  }

  // 글 작성 모달 열기
  const handleOpenCreate = () => {
    if (!currentUser && !isAdmin) {
      if (onOpenAuth) {
        onOpenAuth('login')
        return
      }
    }
    setEditingArticleId(null)
    setShowUrlInput(false)
    setFormData({
      title: '',
      excerpt: '',
      url: '',
      learnUrl: '',
      imageUrl: '',
      platform: 'linkedin',
      tags: '',
      authorHandle: currentUser?.handle || members[0]?.handle || '',
    })
    setIsModalOpen(true)
  }

  // 글 수정 모달 열기 (관리자 또는 본인)
  const handleOpenEdit = (art) => {
    setEditingArticleId(art.id)
    setShowUrlInput(false)
    setFormData({
      title: art.title || '',
      excerpt: art.excerpt || '',
      url: art.url || '',
      learnUrl: art.learnUrl || '',
      imageUrl: art.imageUrl || '',
      platform: art.platform || 'linkedin',
      tags: Array.isArray(art.tags) ? art.tags.join(', ') : (art.tags || ''),
      authorHandle: art.authorHandle || currentUser?.handle || '',
    })
    setIsModalOpen(true)
  }

  // 글 삭제 (관리자 또는 본인)
  const handleDeleteArticle = async (id, title) => {
    if (confirm(`'${title}' 글을 피드에서 완전히 삭제하시겠습니까?`)) {
      await storageService.deleteArticle(id)
    }
  }

  // 글 등록/수정 서브밋
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title?.trim()) return

    let safeUrl = ''
    if (formData.url && formData.url.trim()) {
      safeUrl = sanitizeWebUrl(formData.url)
      if (!safeUrl) {
        alert('올바른 웹 링크 주소(http 또는 https)를 입력해 주세요.')
        return
      }
    }

    const authorMem = members.find((m) => m.handle === (formData.authorHandle || currentUser?.handle))
    let finalLearnUrl = formData.learnUrl?.trim() || ''
    if (finalLearnUrl && authorMem) {
      if (authorMem.contributorId) {
        const generated = generateContributorUrl(finalLearnUrl, authorMem.contributorId)
        if (generated) finalLearnUrl = generated
      }
    } else if (!finalLearnUrl && safeUrl) {
      finalLearnUrl = safeUrl
    }
    finalLearnUrl = (finalLearnUrl ? sanitizeWebUrl(finalLearnUrl) : '') || safeUrl

    setIsSubmitting(true)
    try {
      if (editingArticleId) {
        await storageService.updateArticle(editingArticleId, {
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim(),
          url: safeUrl,
          learnUrl: finalLearnUrl,
          imageUrl: (formData.imageUrl || '').trim(),
          platform: formData.platform,
          tags: formData.tags,
          authorHandle: formData.authorHandle,
        })
      } else {
        await storageService.addArticle({
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim(),
          url: safeUrl,
          learnUrl: finalLearnUrl,
          imageUrl: (formData.imageUrl || '').trim(),
          platform: formData.platform,
          tags: formData.tags,
          authorHandle: formData.authorHandle || currentUser?.handle || 'LIT',
        })
      }

      setFormData({
        title: '',
        excerpt: '',
        url: '',
        learnUrl: '',
        imageUrl: '',
        platform: 'linkedin',
        tags: '',
        authorHandle: currentUser?.handle || '',
      })
      setEditingArticleId(null)
      setIsModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="articles" className="relative scroll-mt-24 px-4 sm:px-6 py-24 sm:py-32 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute left-10 top-1/4 -z-10 h-[280px] w-[280px] sm:h-[400px] sm:w-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,111,177,0.12)_0%,transparent_70%)] blur-[25px] md:blur-[100px]" />

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionHeading
              title="LIT"
              accent="피드"
              desc="블로그와 LinkedIn에 작성한 글을 공유합니다."
            />
          </div>

          <div className="shrink-0 self-start sm:self-auto">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3182F6] hover:bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>새 글 공유하기</span>
            </button>
          </div>
        </div>

        {/* 특정 작성자 필터링 배너 (외부 공유 링크 대응) */}
        {authorFilter && (
          <Reveal delay={0.1} className="mt-6 sm:mt-8">
            <div className="flex items-center justify-between rounded-2xl border border-mint/40 bg-mint/10 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <img
                  src={authorMember?.avatar || AVATAR_PRESETS[0]}
                  alt={authorMember?.name || authorFilter}
                  className="h-10 w-10 rounded-xl object-cover border border-mint/40"
                />
                <div>
                  <h4 className="font-display text-sm font-bold text-fg sm:text-base">
                    {authorMember?.name || authorFilter} 부원의 공유 글
                  </h4>
                  <p className="text-xs text-muted">
                    {authorMember?.major ? `${authorMember.major} · ` : ''}
                    누적 <strong className="text-mint font-bold">{authorMember?.clicks || 0}회</strong> 클릭 달성
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClearAuthorFilter}
                  className="glass flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-muted hover:text-fg hover:border-white/30 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  전체 글 보기
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {/* 1. 필터 및 검색 컨트롤 바 */}
        <Reveal delay={0.1} className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between gap-2.5 min-h-[42px]">
            {/* View tabs: 전체 글 vs 내가 쓴 글 (모바일에서 검색창이 열려있을 때는 검색창이 시원하게 보이도록 숨김) */}
            <div className={`items-center gap-1.5 sm:gap-2 ${isSearchOpen || searchQuery ? 'hidden sm:flex' : 'flex'}`}>
              <button
                type="button"
                onClick={() => {
                  onClearAuthorFilter()
                  setSelectedTag('ALL')
                }}
                className={`rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold transition-all cursor-pointer ${
                  !authorFilter && selectedTag === 'ALL'
                    ? 'bg-fg text-bg shadow-sm'
                    : 'glass text-muted hover:text-fg hover:border-white/30'
                }`}
              >
                전체 피드 <span className="opacity-70 ml-0.5">({articles.length})</span>
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => onFilterAuthor(currentUser.handle)}
                  className={`rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold transition-all cursor-pointer ${
                    authorFilter === currentUser.handle
                      ? 'bg-gradient-to-r from-pink to-violet text-white shadow-md'
                      : 'glass text-muted hover:text-fg hover:border-white/30'
                  }`}
                >
                  내가 쓴 글 <span className="opacity-70 ml-0.5">({articles.filter((a) => a.authorHandle === currentUser.handle).length})</span>
                </button>
              )}
            </div>

            {/* 검색 토글 */}
            <div className={`flex items-center justify-end ${isSearchOpen || searchQuery ? 'w-full sm:w-auto' : ''}`}>
              <AnimatePresence mode="wait">
                {!isSearchOpen && !searchQuery ? (
                  <motion.button
                    key="feed-search-btn"
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
                    className="glass group inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-fg/80 hover:text-fg shadow-xs hover:border-mint/50 cursor-pointer transition-colors shrink-0"
                    title="피드 검색창 열기"
                  >
                    <Search className="h-3.5 w-3.5 text-mint group-hover:scale-110 transition-transform" />
                    <span>검색</span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="feed-search-input"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                      placeholder="제목, 내용, 작성자 검색..."
                      className="glass w-full rounded-full py-2 pl-9 pr-9 text-xs text-fg placeholder:text-muted focus:border-mint/60 focus:outline-none shadow-xs"
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
          </div>
        </Reveal>

        {/* 2. 아티클 카드 그리드 */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.length === 0 ? (
            <div className="glass col-span-full rounded-3xl p-12 text-center text-muted">
              <BookOpen className="mx-auto h-8 w-8 text-muted/50 mb-3" />
              <p className="text-sm">
                {authorFilter
                  ? `${authorMember?.name || authorFilter} 부원이 아직 작성한 글이 없습니다.`
                  : '등록된 글이 없습니다. 첫 번째 글을 공유해 보세요!'}
              </p>
            </div>
          ) : (
            filteredArticles.map((art, i) => {
              const platform = platformStyles[art.platform] || platformStyles.blog
              const author = members.find((m) => m.handle === art.authorHandle)

              return (
                <article
                  key={art.id}
                  onMouseMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - r.left}px`)
                    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - r.top}px`)
                  }}
                  className="spot group glass flex flex-col justify-between rounded-3xl p-6 transition-colors duration-200 hover:-translate-y-1 hover:border-[#3182f6]/40 hover:bg-surface hover:shadow-xl"
                >
                  <div>
                    {/* Header: Platform, Date & Admin/Author Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {art.platform && art.platform !== 'none' && platform?.label && (
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold ${platform.color}`}
                          >
                            {platform.label}
                          </span>
                        )}
                        <span className="text-xs text-muted/70">{art.createdAt}</span>
                      </div>

                      {/* Admin or Author Controls: Edit & Delete */}
                      {(isAdmin || currentUser?.handle === art.authorHandle) && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(art)}
                            title="글 정보/작성자 수정"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-mint hover:bg-white/10 transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art.id, art.title)}
                            title="글 삭제"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-pink hover:bg-white/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Image Thumbnail (if attached) */}
                    {art.imageUrl && (
                      <div className="relative mt-3.5 mb-2 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/[0.03] aspect-video border border-line/60">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="mt-4 font-display text-lg font-bold leading-snug tracking-tight text-fg group-hover:text-gradient transition-colors">
                      {art.url || art.learnUrl ? (
                        <a
                          href={sanitizeWebUrl(art.url || art.learnUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start justify-between gap-2"
                        >
                          <span>{art.title}</span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
                        </a>
                      ) : (
                        <span className="flex items-start justify-between gap-2">
                          <span>{art.title}</span>
                        </span>
                      )}
                    </h3>

                    {/* Excerpt */}
                    <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-3">
                      {art.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {art.tags &&
                        art.tags.map((tg) => (
                          <span
                            key={tg}
                            className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] text-fg/70"
                          >
                            #{tg}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Footer: Author info, Likes, and Support Referral Button */}
                  <div className="mt-6 border-t border-line/70 pt-4">
                    <div className="flex items-center justify-between">
                      {/* Author badge */}
                      <button
                        onClick={() => {
                          const target = members.find((m) => m.handle?.toLowerCase() === art.authorHandle?.toLowerCase()) || { handle: art.authorHandle, name: art.authorName, avatar: art.authorAvatar }
                          if (onOpenProfile) onOpenProfile(target)
                          else onFilterAuthor(art.authorHandle)
                        }}
                        className="flex items-center gap-2 group/author text-left cursor-pointer"
                        title={`${art.authorName} 부원 프로필 보기`}
                      >
                        <img
                          src={art.authorAvatar}
                          alt={art.authorName}
                          className="h-7 w-7 rounded-lg object-cover border border-line transition-transform group-hover/author:scale-105"
                        />
                        <div>
                          <p className="font-display text-xs font-semibold text-fg group-hover/author:text-mint transition-colors">
                            {art.authorName}
                          </p>
                          <p className="text-[11px] text-muted">@{art.authorHandle}</p>
                        </div>
                      </button>

                      {/* Like button */}
                      <button
                        onClick={(e) => handleLike(e, art.id)}
                        className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted transition-colors hover:text-pink hover:border-pink/40"
                      >
                        <Heart className="h-3.5 w-3.5 text-pink fill-pink/30" />
                        <span className="text-xs font-semibold">{art.likes || 0}</span>
                      </button>
                    </div>

                    {/* Link Button: MS Learn 링크 또는 미입력 시 원문 링크 */}
                    {(art.learnUrl || art.url) && (
                      <a
                        href={sanitizeWebUrl(art.learnUrl || art.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${author?.name || '작성자'}님의 링크 열기`}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white/[0.02] py-2 text-xs text-muted transition-all hover:bg-white/[0.07] hover:text-fg hover:border-mint/40"
                      >
                        <span>추천 링크 바로가기</span>
                        <ExternalLink className="h-3.5 w-3.5 text-mint" />
                      </a>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>

      {/* 새 글 공유 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-panel relative w-full max-w-lg rounded-3xl border border-line bg-surface p-7 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2">
                  {isAdmin ? <ShieldCheck className="h-5 w-5 text-[#3182F6]" /> : <Edit3 className="h-5 w-5 text-mint" />}
                  <div>
                    <h3 className="font-display text-xl font-bold text-fg">
                      {editingArticleId ? '글 내용 및 작성자 수정' : '새 글 공유하기'}
                    </h3>
                    {isAdmin && (
                      <p className="text-xs text-muted">
                        운영진 권한으로 글 내용 및 작성자를 수정합니다.
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingArticleId(null)
                  }}
                  className="rounded-full p-1 text-muted hover:text-fg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    글 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    enterKeyHint="next"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="glass w-full rounded-xl px-3.5 py-2.5 h-[42px] text-xs text-fg focus:border-[#3182F6]/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">
                      플랫폼 *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        className="glass w-full appearance-none rounded-xl px-3.5 pr-8 py-2.5 h-[42px] text-xs text-fg focus:border-[#3182F6]/50 focus:outline-none bg-surface cursor-pointer"
                      >
                        <option value="linkedin">LinkedIn</option>
                        <option value="velog">Velog</option>
                        <option value="blog">개인 블로그 / Tistory</option>
                        <option value="github">GitHub Repo / Issue</option>
                        <option value="none">없음</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">
                      작성자 *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.authorHandle}
                        onChange={(e) => setFormData({ ...formData, authorHandle: e.target.value })}
                        className="glass w-full appearance-none rounded-xl px-3.5 pr-8 py-2.5 h-[42px] text-xs text-fg focus:border-pink/50 focus:outline-none bg-surface cursor-pointer"
                      >
                        {isAdmin && (
                          <option value="LIT">LIT 운영진 (@LIT)</option>
                        )}
                        {members.map((m) => (
                          <option key={m.handle} value={m.handle}>
                            {m.name} (@{m.handle})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    원문 링크 URL (선택, LinkedIn 포스트, 블로그 주소)
                  </label>
                  <input
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://linkedin.com/posts/... 또는 https://velog.io/..."
                    className="glass w-full rounded-xl px-3.5 py-2.5 h-[42px] text-xs text-fg focus:border-pink/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    첨부할 MS Learn 링크
                  </label>
                  <input
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    value={formData.learnUrl || ''}
                    onChange={(e) => setFormData({ ...formData, learnUrl: e.target.value })}
                    placeholder="https://learn.microsoft.com/... (글과 관련된 MS Learn 모듈 링크)"
                    className="glass w-full rounded-xl px-3.5 py-2.5 h-[42px] text-xs text-fg focus:border-pink/50 focus:outline-none placeholder:text-muted/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    글 소개
                  </label>
                  <textarea
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="어떤 내용의 글인지 2~3줄로 요약해 주세요."
                    className="glass w-full rounded-xl px-3.5 py-2.5 text-xs text-fg focus:border-pink/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    enterKeyHint="done"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Azure, AI, RAG, Meetup"
                    className="glass w-full rounded-xl px-3.5 py-2.5 h-[42px] text-xs text-fg focus:border-pink/50 focus:outline-none"
                  />
                </div>

                {/* 이미지 첨부 (태그 밑 칸) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted">
                      이미지 첨부 <span className="text-[11px] text-muted/70 font-normal ml-1">(16:9 비율로 조정됩니다)</span>
                    </label>
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: '' })
                          setShowUrlInput(false)
                        }}
                        className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                      >
                        이미지 삭제
                      </button>
                    )}
                  </div>

                  {formData.imageUrl ? (
                    <div className="relative overflow-hidden rounded-2xl border border-line bg-slate-50 dark:bg-white/[0.02] aspect-video max-h-48 group">
                      <img
                        src={formData.imageUrl}
                        alt="첨부 이미지 미리보기"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: '' })
                          setShowUrlInput(false)
                        }}
                        className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                        title="이미지 삭제"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="article-image-file"
                        className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line hover:border-[#3182F6]/60 bg-slate-50/50 dark:bg-white/[0.01] py-4 px-3 cursor-pointer transition-colors"
                      >
                        <Upload className="h-5 w-5 text-[#3182F6]" />
                        <span className="text-xs font-semibold text-fg">기기에서 사진 업로드</span>
                        <input
                          id="article-image-file"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      {/* 이미지 주소(URL) 입력 토글 */}
                      {!showUrlInput ? (
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(true)}
                          className="text-[11px] text-muted hover:text-[#3182F6] transition-colors cursor-pointer self-start"
                        >
                          + 이미지 주소(URL)로 직접 입력
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={formData.imageUrl || ''}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://..."
                            className="flex-1 rounded-xl border border-line bg-white dark:bg-surface-2 px-3 py-2 text-xs text-fg placeholder:text-muted/50 focus:border-[#3182F6] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(false)}
                            className="text-xs text-muted hover:text-fg px-2 py-1.5 cursor-pointer"
                          >
                            닫기
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                      setEditingArticleId(null)
                    }}
                    className="glass rounded-xl px-4 py-2.5 text-xs text-muted hover:text-fg"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-[#3182F6] hover:bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#3182f6]/25 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isSubmitting ? '저장 중...' : (editingArticleId ? '수정사항 저장' : '공유 등록하기')}
                  </button>
                </div>
              </form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </section>
  )
}

