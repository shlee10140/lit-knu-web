import Modal from './ui/Modal.jsx'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Edit3, Save, Sparkles, Trash2, Upload, User, ShieldCheck, X } from 'lucide-react'
import { storageService, extractContributorId, AVATAR_PRESETS, compressImage } from '../services/storageService.js'

export default function ProfileModal({ isOpen, onClose, targetMember = null }) {
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())
  const [activeMember, setActiveMember] = useState(targetMember || storageService.getCurrentUser())
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    major: '',
    avatar: '',
    certifications: '',
    contributorId: '',
    bio: '',
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
        const rawId = (user.contributorId || '').trim()
        const isDefaultAdminId =
          user.handle !== 'tlgjs' &&
          user.handle !== 'LIT' &&
          (rawId.includes('482865') || (user.msLink || '').includes('482865'))
        setFormData({
          name: user.name || '',
          role: user.role || '',
          major: user.major || '',
          avatar: user.avatar || '',
          certifications: user.certifications || '',
          contributorId: isDefaultAdminId ? '' : rawId,
          bio: user.bio || '',
        })
      }
      setNewPassword('')
      setShowUrlInput(false)
    }
  }, [isOpen, targetMember])

  if (!isOpen || !activeMember) return null

  const isEditingOther = isAdmin && activeMember.handle !== currentUser?.handle && activeMember.handle !== 'LIT'

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 30 * 1024 * 1024) {
      alert('이미지 파일 크기는 30MB 이하여야 합니다.')
      return
    }
    try {
      const compressed = await compressImage(file, 360, 0.85)
      setFormData((prev) => ({ ...prev, avatar: compressed }))
    } catch (err) {
      alert('이미지 처리 중 오류가 발생했습니다. 다른 사진을 선택해 주세요.')
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
        contributorId: activeMember.handle === 'LIT' ? '' : formData.contributorId.trim(),
        bio: formData.bio.trim(),
      }

      if (newPassword.trim()) {
        updatePayload.password = newPassword.trim()
      }

      await storageService.updateMemberProfile(activeMember.handle, updatePayload)
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
              <ShieldCheck className="h-5 w-5 text-[#3182F6]" />
            ) : (
              <Edit3 className="h-5 w-5 text-mint" />
            )}
            <div>
              <h3 className="font-display text-xl font-bold text-fg">
                {isEditingOther
                  ? `[${activeMember.name}] 부원 정보 관리`
                  : '내 프로필 수정'}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4 pr-1">
          {/* Profile Photo Customization (AuthModal 가입 스타일과 통일) */}
          <div className="rounded-2xl border border-line bg-slate-50/70 dark:bg-white/[0.02] p-3">
            <div className="flex items-center gap-3">
              <div className="relative group shrink-0">
                <img
                  src={formData.avatar || activeMember.avatar || AVATAR_PRESETS[0]}
                  alt={formData.name || 'avatar'}
                  className="h-11 w-11 rounded-full object-cover border-2 border-white dark:border-surface shadow-xs"
                />
                <label
                  htmlFor="profile-avatar-file"
                  title="기기에서 사진 업로드"
                  className="absolute bottom-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#3182F6] text-white shadow-xs cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                >
                  <Camera className="h-2.5 w-2.5" />
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg">프로필 사진</span>
                  <label
                    htmlFor="profile-avatar-file"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3182F6] hover:underline cursor-pointer"
                  >
                    <Upload className="h-3 w-3" />
                    업로드
                  </label>
                </div>

                {/* 프리셋 컬러 칩 */}
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {AVATAR_PRESETS.map((preset, idx) => {
                    const isSelected =
                      formData.avatar === preset ||
                      (!formData.avatar && activeMember.avatar === preset)
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: preset })}
                        title={`컬러 ${idx + 1}`}
                        className={`h-4 w-4 rounded-full overflow-hidden transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-[#3182F6] ring-offset-2 ring-offset-surface scale-110'
                            : 'opacity-70 hover:opacity-100 hover:scale-110'
                        }`}
                      >
                        <img src={preset} alt={`preset-${idx}`} className="h-full w-full object-cover" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* URL 직접 입력 토글 */}
            <div className="mt-2 pt-1.5 border-t border-line/50">
              {!showUrlInput ? (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="text-[10px] text-muted hover:text-[#3182F6] transition-colors"
                >
                  + URL로 직접 입력
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={formData.avatar?.startsWith('data:') ? '' : (formData.avatar || '')}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 rounded-lg border border-line bg-white dark:bg-surface-2 px-2.5 py-1 text-xs text-fg placeholder:text-muted/50 focus:border-[#3182F6] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(false)}
                    className="text-xs text-muted hover:text-fg px-1.5"
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">이름</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-mint/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">동아리 역할</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="예: LIT 부원, 회장, AI 엔지니어"
                className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-mint/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              전공 / 학번
            </label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder="예: 컴퓨터학부 21학번"
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-mint/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              보유 MS 자격증
            </label>
            <input
              type="text"
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder="예: AI-900, AZ-900, DP-900"
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-mint/50 focus:outline-none"
            />
          </div>

          {activeMember.handle !== 'LIT' && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                MS LEARN CONTRIBUTOR ID
              </label>
              <input
                type="text"
                value={formData.contributorId}
                onChange={(e) => setFormData({ ...formData, contributorId: e.target.value })}
                placeholder="예: studentamb_XXXXXX"
                className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-mint/50 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              한 줄 소개
            </label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="동아리 부원들에게 나를 소개해보세요"
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-mint/50 focus:outline-none resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-muted">
                새 학번 변경 (변경할 때만 입력)
              </label>
              <span className="text-[11px] text-muted">초기 비밀번호는 학번입니다</span>
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="변경할 새 학번을 입력하세요"
              className="glass w-full rounded-xl px-3 py-2 text-xs text-fg focus:border-[#3182F6]/50 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-2 pt-2">
            {isEditingOther ? (
              <button
                type="button"
                onClick={handleDeleteMember}
                className="glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs text-rose-400 hover:text-rose-500 hover:border-rose-500/40 cursor-pointer"
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#3182F6] hover:bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#3182f6]/25 hover:opacity-90 transition-opacity disabled:opacity-50"
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
