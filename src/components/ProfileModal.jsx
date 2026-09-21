import Modal from './ui/Modal.jsx'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Edit3, ExternalLink, Link2, Minus, Plus, Save, Sparkles, Trash2, Upload, User, ShieldCheck, X } from 'lucide-react'
import { storageService, extractContributorId, formatContributorLink, AVATAR_PRESETS, compressImage } from '../services/storageService.js'

export default function ProfileModal({ isOpen, onClose, targetMember = null }) {
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())
  const [activeMember, setActiveMember] = useState(targetMember || storageService.getCurrentUser())
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    major: '',
    avatar: '',
    certifications: '',
    contributorId: '',
    bio: '',
    clicks: 0,
    links: [],
  })

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser())
      setIsAdmin(storageService.isAdmin())
    })
    return unsub
  }, [])

  useEffect(() => {
    if (isOpen) {
      const adminStatus = storageService.isAdmin()
      setIsAdmin(adminStatus)
      const user = targetMember || storageService.getCurrentUser()
      setActiveMember(user)
      if (user) {
        let initialLinks = []
        if (Array.isArray(user.links) && user.links.length > 0) {
          initialLinks = user.links.map((l, i) => ({
            id: l.id || `link-${i}-${Date.now()}`,
            title: l.title || l.name || l.platform || '',
            url: l.url || '',
          }))
        } else if (user.socials) {
          if (user.socials.linkedin) {
            initialLinks.push({ id: `s-ln-${Date.now()}`, title: 'LinkedIn', url: user.socials.linkedin })
          }
          if (user.socials.github) {
            initialLinks.push({ id: `s-gh-${Date.now()}`, title: 'GitHub', url: user.socials.github })
          }
          if (user.socials.blog) {
            initialLinks.push({ id: `s-bl-${Date.now()}`, title: '기술 블로그', url: user.socials.blog })
          }
        }

        setFormData({
          name: user.name || '',
          role: user.role || '',
          major: user.major || '',
          avatar: user.avatar || '',
          certifications: user.certifications || '',
          contributorId: user.contributorId || extractContributorId(user.msLink) || '',
          bio: user.bio || '',
          clicks: user.clicks || 0,
          links: initialLinks,
        })
      }
      setNewPassword('')
    }
  }, [isOpen, targetMember])

  if (!isOpen || !activeMember) return null

  const isEditingOther = isAdmin && activeMember.handle !== currentUser?.handle && activeMember.handle !== 'LIT'

  const handleClicksChange = (delta) => {
    setFormData((prev) => ({
      ...prev,
      clicks: Math.max(0, Number(prev.clicks) + delta),
    }))
  }

  const handleAddLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [
        ...(prev.links || []),
        { id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: '', url: '' },
      ],
    }))
  }

  const handleAddPresetLink = (presetTitle) => {
    setFormData((prev) => ({
      ...prev,
      links: [
        ...(prev.links || []),
        { id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: presetTitle, url: '' },
      ],
    }))
  }

  const handleLinkChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.links || [])]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, links: updated }
    })
  }

  const handleRemoveLink = (index) => {
    setFormData((prev) => {
      const updated = [...(prev.links || [])]
      updated.splice(index, 1)
      return { ...prev, links: updated }
    })
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기는 10MB 이하여야 합니다.')
      return
    }
    try {
      const compressed = await compressImage(file, 240, 0.8)
      setFormData((prev) => ({ ...prev, avatar: compressed }))
    } catch (err) {
      alert('이미지 압축 처리 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteMember = async () => {
    if (!isAdmin) return
    if (confirm(`정말 '${activeMember.name}(@${activeMember.handle})' 부원을 동아리 명단에서 삭제하시겠습니까?`)) {
      await storageService.deleteMember(activeMember.handle)
      alert(`'${activeMember.name}' 부원이 명단에서 삭제되었습니다.`)
      onClose()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const filteredLinks = (formData.links || [])
        .filter((l) => l.url && l.url.trim())
        .map((l) => ({
          id: l.id || `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: (l.title || '링크').trim(),
          url: l.url.trim(),
        }))

      const updatePayload = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        major: formData.major.trim(),
        avatar: (formData.avatar || activeMember.avatar || '').trim(),
        certifications: formData.certifications.trim(),
        contributorId: formData.contributorId.trim(),
        bio: formData.bio.trim(),
        clicks: Number(formData.clicks),
        links: filteredLinks,
        socials: {
          linkedin:
            filteredLinks.find(
              (l) => l.title.toLowerCase().includes('linkedin') || l.url.includes('linkedin.com')
            )?.url || '',
          github:
            filteredLinks.find(
              (l) => l.title.toLowerCase().includes('github') || l.url.includes('github.com')
            )?.url || '',
          blog:
            filteredLinks.find(
              (l) =>
                l.title.toLowerCase().includes('blog') ||
                l.title.toLowerCase().includes('블로그') ||
                l.url.includes('velog.io') ||
                l.url.includes('tistory.com')
            )?.url || '',
        },
      }

      if (newPassword.trim()) {
        updatePayload.password = newPassword.trim()
      }

      await storageService.updateMemberProfile(activeMember.handle, updatePayload)
      await storageService.updateMemberClicks(activeMember.handle, Number(formData.clicks), true)
      setNewPassword('')
      onClose()
    } catch (err) {
      alert(`프로필 저장 중 오류가 발생했습니다: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
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
            {isAdmin ? (
              <ShieldCheck className="h-5 w-5 text-pink" />
            ) : (
              <Edit3 className="h-5 w-5 text-mint" />
            )}
            <div>
              <h3 className="font-display text-xl font-bold text-fg">
                {isEditingOther
                  ? `[${activeMember.name}] 부원 정보 관리`
                  : '내 프로필 & 클릭수 수정'}
              </h3>
              {isAdmin && (
                <span className="font-mono text-[10px] text-pink font-semibold">
                  👑 운영진 관리자 모드 활성 (모든 정보 수정 가능)
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4 pr-1">
          {/* Clicks count adjustment box */}
          <div className="rounded-2xl border border-pink/30 bg-pink/[0.06] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-pink">
                {isEditingOther ? `${activeMember.name} 님의 클릭수` : '현재 달성 클릭수'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleClicksChange(-1)}
                  className="glass flex h-9 w-9 items-center justify-center rounded-xl text-fg hover:border-pink/40 hover:bg-white/[0.06] active:scale-95 transition-all"
                  aria-label="클릭수 감소"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={formData.clicks}
                  onChange={(e) =>
                    setFormData({ ...formData, clicks: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="glass h-9 w-20 rounded-xl px-0 text-center font-sans text-lg font-bold tabular-nums text-fg focus:outline-none focus:border-pink/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => handleClicksChange(1)}
                  className="glass flex h-9 w-9 items-center justify-center rounded-xl text-fg hover:border-pink/40 hover:bg-white/[0.06] active:scale-95 transition-all"
                  aria-label="클릭수 증가"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Photo Customization */}
          <div className="rounded-2xl border border-line bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-3.5">
              <div className="relative group shrink-0">
                <img
                  src={formData.avatar || activeMember.avatar || AVATAR_PRESETS[0]}
                  alt={formData.name || 'avatar'}
                  className="h-14 w-14 rounded-2xl object-cover border-2 border-mint/50 shadow-md"
                />
                <label
                  htmlFor="profile-avatar-file"
                  title="기기에서 사진 업로드"
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                >
                  <Camera className="h-5 w-5" />
                </label>
                <input
                  id="profile-avatar-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[10px] uppercase text-muted">프로필 사진 등록</label>
                  <label
                    htmlFor="profile-avatar-file"
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-mint hover:underline cursor-pointer"
                  >
                    <Upload className="h-3 w-3" /> 내 기기에서 사진 업로드
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="또는 이미지 URL 직접 입력 (https://...)"
                  className="glass w-full rounded-xl px-2.5 py-1.5 text-xs text-fg focus:border-mint/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick avatar presets */}
            <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-line/50 flex-wrap">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: preset })}
                  title={`단색 컬러 프리셋 ${idx + 1}`}
                  className={`h-6 w-6 rounded-lg overflow-hidden border transition-all shrink-0 ${
                    formData.avatar === preset
                      ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.5)] ring-2 ring-white/50'
                      : 'border-white/20 hover:border-mint hover:scale-110'
                  }`}
                >
                  <img src={preset} alt={`preset-${idx}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-muted mb-1">이름</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-pink/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-muted mb-1">동아리 역할</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="LIT 부원, 기술팀장 등"
                className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-pink/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-muted mb-1">전공 / 학번</label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder=""
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-pink/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-muted mb-1">
              보유 MS 자격증
            </label>
            <input
              type="text"
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder="예: AI-900, AZ-900, DP-900"
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-pink/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-muted mb-1">
              MS Learn Contributor ID
            </label>
            <input
              type="text"
              value={formData.contributorId}
              onChange={(e) => setFormData({ ...formData, contributorId: e.target.value })}
              placeholder="예: studentamb_482865 또는 482865"
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-pink/50 focus:outline-none"
            />
          </div>

          {/* PR Links (Linktree) Management Section */}
          <div className="rounded-2xl border border-line bg-white/[0.03] p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted">
                  <Link2 className="h-3 w-3 text-mint" />
                  나만의 PR 링크 (Linktree)
                </label>
                <p className="text-[11px] text-muted mt-0.5">
                  포트폴리오, GitHub, LinkedIn, 블로그 등 부원들에게 공유할 링크를 등록하세요.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLink}
                className="inline-flex items-center gap-1 rounded-lg border border-mint/40 bg-mint/10 px-2.5 py-1 font-mono text-xs font-semibold text-mint hover:bg-mint/20 transition-all shrink-0"
              >
                <Plus className="h-3 w-3" />
                <span>추가</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 my-2 pt-2 border-t border-line/40">
              <span className="font-mono text-[10px] text-muted mr-0.5">빠른 추가:</span>
              {[
                { title: '포트폴리오' },
                { title: 'GitHub' },
                { title: 'LinkedIn' },
                { title: '기술 블로그' },
                { title: 'Notion 이력서' },
              ].map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => handleAddPresetLink(preset.title)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-muted hover:border-mint/40 hover:text-mint hover:bg-mint/10 transition-colors"
                >
                  +{preset.title}
                </button>
              ))}
            </div>

            {/* Link List */}
            <div className="space-y-2 mt-2.5">
              {(formData.links || []).map((link, idx) => (
                <div key={link.id || idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => handleLinkChange(idx, 'title', e.target.value)}
                    placeholder="링크명 (예: LinkedIn)"
                    className="glass w-2/5 sm:w-1/3 rounded-xl px-2.5 py-1.5 text-xs text-fg focus:border-pink/50 focus:outline-none shrink-0"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                    placeholder="URL (https://...)"
                    className="glass flex-1 rounded-xl px-2.5 py-1.5 text-xs text-fg focus:border-pink/50 focus:outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="rounded-xl p-1.5 text-muted hover:text-pink hover:bg-pink/10 transition-colors shrink-0"
                    title="링크 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {(!formData.links || formData.links.length === 0) && (
                <p className="text-center py-2.5 font-mono text-xs text-muted/60">
                  등록된 PR 링크가 없습니다. 위 빠른 추가 버튼이나 추가 버튼을 눌러보세요.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-muted mb-1">
              한 줄 소개
            </label>
            <input
              type="text"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-pink/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-muted mb-1">
              새 학번 변경 (변경할 때만 입력)
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="변경할 새 학번을 입력하세요"
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-pink/50 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-2 pt-2">
            {isEditingOther ? (
              <button
                type="button"
                onClick={handleDeleteMember}
                className="glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs text-pink/80 hover:text-pink hover:border-pink/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                부원 삭제
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="glass rounded-xl px-4 py-2.5 text-xs text-muted hover:text-fg"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))] px-5 py-2.5 text-xs font-bold text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? '클라우드 저장 중...' : '변경사항 저장'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </Modal>
  )
}

