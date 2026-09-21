import Modal from './ui/Modal.jsx'
import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { storageService, generateContributorUrl, AVATAR_PRESETS } from '../services/storageService.js'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'
import MagneticButton from './ui/MagneticButton.jsx'

const platformStyles = {
  linkedin: { label: 'LinkedIn', color: 'bg-[#0077b5]/15 text-[#0077b5] border-[#0077b5]/30' },
  velog: { label: 'Velog', color: 'bg-[#20c997]/15 text-[#20c997] border-[#20c997]/30' },
  blog: { label: 'Blog', color: 'bg-amber/15 text-amber border-amber/30' },
  github: { label: 'GitHub', color: 'bg-white/10 text-fg border-white/20' },
}

export default function ArticleHub({ authorFilter, onClearAuthorFilter, onFilterAuthor, onOpenAuth, onOpenProfile }) {
  const [articles, setArticles] = useState(storageService.getArticles())
  const [members, setMembers] = useState(storageService.getMembers())
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 글 작성/수정 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    url: '',
    learnUrl: '',
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

  // 글 작성 모달 열기
  const handleOpenCreate = () => {
    if (!currentUser && !isAdmin) {
      if (onOpenAuth) {
        onOpenAuth('login')
        return
      }
    }
    setEditingArticleId(null)
    setFormData({
      title: '',
      excerpt: '',
      url: '',
      learnUrl: '',
      platform: 'linkedin',
      tags: '',
      authorHandle: currentUser?.handle || members[0]?.handle || '',
    })
    setIsModalOpen(true)
  }

  // 글 수정 모달 열기 (관리자 또는 본인)
  const handleOpenEdit = (art) => {
    setEditingArticleId(art.id)
    setFormData({
      title: art.title || '',
      excerpt: art.excerpt || '',
      url: art.url || '',
      learnUrl: art.learnUrl || '',
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
    if (!formData.title || !formData.url) return

    const authorMem = members.find((m) => m.handle === (formData.authorHandle || currentUser?.handle))
    let finalLearnUrl = formData.learnUrl?.trim() || ''
    if (finalLearnUrl && authorMem) {
      const generated = generateContributorUrl(finalLearnUrl, authorMem.contributorId || authorMem.handle)
      if (generated) finalLearnUrl = generated
    } else if (!finalLearnUrl) {
      finalLearnUrl = formData.url.trim()
    }

    setIsSubmitting(true)
    try {
      if (editingArticleId) {
        await storageService.updateArticle(editingArticleId, {
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim(),
          url: formData.url.trim(),
          learnUrl: finalLearnUrl,
          platform: formData.platform,
          tags: formData.tags,
          authorHandle: formData.authorHandle,
        })
      } else {
        await storageService.addArticle({
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim(),
          url: formData.url.trim(),
          learnUrl: finalLearnUrl,
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
      <div className="pointer-events-none absolute left-10 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-pink/10 blur-[140px]" />

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionHeading
              eyebrow="Feed"
              title="LIT"
              accent="피드"
              desc="블로그와 LinkedIn에 작성한 글을 공유합니다."
            />
            {isAdmin && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-pink/40 bg-pink/15 px-3 py-1 font-mono text-[11px] text-pink font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                운영진 관리자 모드 활성 (모든 글 수정/삭제 가능)
              </div>
            )}
          </div>

          <Reveal delay={0.2}>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))] px-6 py-3.5 text-xs font-bold text-bg transition-transform duration-300 hover:scale-[1.03] active:scale-95 shadow-lg shadow-pink/20"
            >
              <Plus className="h-4 w-4" />새 글 공유하기
            </button>
          </Reveal>
        </div>

        {/* 특정 작성자 필터링 배너 (외부 공유 링크 대응) */}
        {authorFilter && (
          <Reveal delay={0.1} className="mt-8">
            <div className="flex items-center justify-between rounded-2xl border border-mint/40 bg-mint/10 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <img
                  src={authorMember?.avatar || AVATAR_PRESETS[0]}
                  alt={authorMember?.name || authorFilter}
                  className="h-10 w-10 rounded-xl object-cover border border-mint/40"
                />
                <div>
                  <h4 className="font-display text-sm font-bold text-fg sm:text-base">
                    👋 {authorMember?.name || authorFilter} 님의 글 모아보기
                  </h4>
                  <p className="text-xs text-muted">
                    {authorMember?.major} · 목표 250명 중 현재{' '}
                    <strong className="text-mint font-bold">{authorMember?.clicks || 0}명 달성!</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClearAuthorFilter}
                  className="glass flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-muted hover:text-fg hover:border-white/30"
                >
                  <X className="h-3.5 w-3.5" />
                  전체 글 보기
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {/* 1. 필터 및 검색 컨트롤 바 */}
        <Reveal delay={0.15} className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* View tabs: 전체 글 vs 내가 쓴 글 */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  onClearAuthorFilter()
                  setSelectedTag('ALL')
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  !authorFilter && selectedTag === 'ALL'
                    ? 'bg-fg text-bg'
                    : 'glass text-muted hover:text-fg hover:border-white/30'
                }`}
              >
                전체 피드 ({articles.length})
              </button>

              {currentUser && (
                <button
                  onClick={() => onFilterAuthor(currentUser.handle)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    authorFilter === currentUser.handle
                      ? 'bg-gradient-to-r from-pink to-violet text-white shadow-lg'
                      : 'glass text-muted hover:text-fg hover:border-white/30'
                  }`}
                >
                  내가 쓴 글 ({articles.filter((a) => a.authorHandle === currentUser.handle).length})
                </button>
              )}
            </div>

            {/* 검색창 */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목, 내용, 작성자 검색..."
                className="glass w-full rounded-full py-2 pl-9 pr-4 text-xs text-fg placeholder:text-muted focus:border-mint/60 focus:outline-none"
              />
            </div>
          </div>
        </Reveal>

        {/* 2. 아티클 카드 그리드 */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.length === 0 ? (
            <div className="glass col-span-full rounded-3xl p-12 text-center text-muted">
              <BookOpen className="mx-auto h-8 w-8 text-muted/50 mb-3" />
              <p className="text-sm">등록된 글이 없습니다. 첫 번째 글을 공유해 보세요!</p>
            </div>
          ) : (
            filteredArticles.map((art, i) => {
              const platform = platformStyles[art.platform] || platformStyles.blog
              const author = members.find((m) => m.handle === art.authorHandle)

              return (
                <motion.article
                  key={art.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="spot group glass flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-surface"
                >
                  <div>
                    {/* Header: Platform, Date & Admin/Author Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-semibold ${platform.color}`}
                        >
                          {platform.label}
                        </span>
                        <span className="font-mono text-[10px] text-muted">{art.createdAt}</span>
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

                    {/* Title */}
                    <h3 className="mt-4 font-display text-lg font-bold leading-snug tracking-tight text-fg group-hover:text-gradient transition-colors">
                      <a href={art.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2">
                        <span>{art.title}</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
                      </a>
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
                            className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-fg/70"
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
                          <p className="font-mono text-[9px] text-muted">@{art.authorHandle}</p>
                        </div>
                      </button>

                      {/* Like button */}
                      <button
                        onClick={(e) => handleLike(e, art.id)}
                        className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted transition-colors hover:text-pink hover:border-pink/40"
                      >
                        <Heart className="h-3.5 w-3.5 text-pink fill-pink/30" />
                        <span className="font-mono text-[11px]">{art.likes || 0}</span>
                      </button>
                    </div>

                    {/* Link Button: MS Learn 링크 또는 미입력 시 원문 링크 */}
                    <a
                      href={art.learnUrl || art.url}
                      target="_blank"
                      rel="noreferrer"
                      title={`${author?.name || '작성자'}님의 링크 열기`}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white/[0.02] py-2 text-xs text-muted transition-all hover:bg-white/[0.07] hover:text-fg hover:border-mint/40"
                    >
                      <span>{author?.name || '작성자'}님의 링크 클릭</span>
                      <ExternalLink className="h-3.5 w-3.5 text-mint" />
                    </a>
                  </div>
                </motion.article>
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
                  {isAdmin ? <ShieldCheck className="h-5 w-5 text-pink" /> : <Edit3 className="h-5 w-5 text-mint" />}
                  <div>
                    <h3 className="font-display text-xl font-bold text-fg">
                      {editingArticleId ? '글 내용 및 작성자 수정' : '새 글 공유하기'}
                    </h3>
                    {isAdmin && (
                      <p className="font-mono text-[10px] text-pink font-semibold">
                        👑 운영진 권한으로 글 내용 및 작성자를 조정합니다.
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
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    글 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: Azure OpenAI로 3일만에 챗봇 구축한 후기"
                    className="glass w-full rounded-xl px-3.5 py-2.5 text-xs text-fg focus:border-pink/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                      플랫폼 *
                    </label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="glass w-full rounded-xl px-3.5 py-2.5 text-xs text-fg focus:border-pink/50 focus:outline-none bg-surface"
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="velog">Velog</option>
                      <option value="blog">개인 블로그 / Tistory</option>
                      <option value="github">GitHub Repo / Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                      작성자 *
                    </label>
                    <select
                      value={formData.authorHandle}
                      onChange={(e) => setFormData({ ...formData, authorHandle: e.target.value })}
                      className="glass w-full rounded-xl px-3.5 py-2.5 text-xs text-fg focus:border-pink/50 focus:outline-none bg-surface"
                    >
                      {isAdmin && (
                        <option value="LIT">👑 LIT 운영진 (@LIT)</option>
                      )}
                      {members.map((m) => (
                        <option key={m.handle} value={m.handle}>
                          {m.name} (@{m.handle})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    원문 링크 URL * (LinkedIn 포스트, 블로그 주소)
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://linkedin.com/posts/... 또는 https://velog.io/..."
                    className="glass w-full rounded-xl px-3.5 py-2.5 text-xs text-fg focus:border-pink/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    첨부할 MS Learn 링크
                  </label>
                  <input
                    type="url"
                    value={formData.learnUrl || ''}
                    onChange={(e) => setFormData({ ...formData, learnUrl: e.target.value })}
                    placeholder="https://learn.microsoft.com/... (글과 관련된 MS Learn 모듈 링크)"
                    className="glass w-full rounded-xl px-3.5 py-2.5 text-xs text-fg focus:border-pink/50 focus:outline-none placeholder:text-muted/50"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    💡 독자가 카드 하단의 &apos;~님의 링크 클릭&apos; 버튼을 누르면 이 링크로 이동합니다. (미입력 시 원문 링크로 이동)
                  </p>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                    글 요약 / 소개 (선택)
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
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Azure, AI, RAG, Meetup"
                    className="glass w-full rounded-xl px-3.5 py-2.5 text-xs text-fg focus:border-pink/50 focus:outline-none"
                  />
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
                    className="rounded-xl bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))] px-5 py-2.5 text-xs font-bold text-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
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

