import Modal from './ui/Modal.jsx'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Edit3, ExternalLink, Minus, Plus, Save, Sparkles, Trash2, Upload, User, ShieldCheck, X } from 'lucide-react'
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
    linkedin: '',
    blog: '',
    github: '',
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
        setFormData({
          name: user.name || '',
          role: user.role || '',
          major: user.major || '',
          avatar: user.avatar || '',
          certifications: user.certifications || '',
          contributorId: user.contributorId || extractContributorId(user.msLink) || '',
          bio: user.bio || '',
          clicks: user.clicks || 0,
          linkedin: user.socials?.linkedin || '',
          blog: user.socials?.blog || '',
          github: user.socials?.github || '',
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
      const updatePayload = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        major: formData.major.trim(),
        avatar: (formData.avatar || activeMember.avatar || '').trim(),
        certifications: formData.certifications.trim(),
        contributorId: formData.contributorId.trim(),
        bio: formData.bio.trim(),
        clicks: Number(formData.clicks),
        socials: {
          linkedin: formData.linkedin.trim(),
          blog: formData.blog.trim(),
          github: formData.github.trim(),
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

          <div>
            <label className="block font-mono text-[10px] uppercase text-muted mb-1">
              LinkedIn 프로필 URL
            </label>
            <input
              type="text"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-pink/50 focus:outline-none"
            />
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

