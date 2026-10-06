import Modal from './ui/Modal.jsx'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Camera,
  Check,
  LogIn,
  LogOut,
  ShieldAlert,
  Upload,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react'
import { storageService, AVATAR_PRESETS, compressImage } from '../services/storageService.js'

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab) // 'login', 'register'
  const [members, setMembers] = useState(storageService.getMembers())
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab)
    }
  }, [isOpen, initialTab])

  // 로그인 폼
  const [loginHandle, setLoginHandle] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // 회원가입 폼
  const [newMember, setNewMember] = useState({
    name: '',
    handle: '',
    password: '',
    passwordConfirm: '',
    major: '',
    avatar: '',
    certifications: '',
    contributorId: '',
    bio: '',
    clicks: 0,
    linkedin: '',
  })
  const [registerError, setRegisterError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 30 * 1024 * 1024) {
      setRegisterError('프로필 사진 파일 크기는 30MB 이하여야 합니다.')
      return
    }
    try {
      const compressed = await compressImage(file, 360, 0.85)
      setNewMember((prev) => ({ ...prev, avatar: compressed }))
    } catch (err) {
      setRegisterError('이미지 처리 중 오류가 발생했습니다. 다른 사진을 선택해 주세요.')
    }
  }

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setMembers(storageService.getMembers())
      setCurrentUser(storageService.getCurrentUser())
      setIsAdmin(storageService.isAdmin())
    })
    return unsub
  }, [isOpen])

  if (!isOpen) return null

  // 1. 로그인 처리 (LIT 입력 시 자동으로 관리자 모드 활성화)
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginSuccess('')

    if (!loginHandle) {
      setLoginError('아이디를 입력해 주세요.')
      return
    }

    setIsLoggingIn(true)
    try {
      const res = await storageService.loginMember(loginHandle, loginPassword)
      if (res.success) {
        const msg = res.isAdmin
          ? 'LIT 운영진으로 로그인되었습니다.'
          : `${res.member.name}님으로 로그인되었습니다.`
        setLoginSuccess(msg)
        setTimeout(() => {
          setLoginSuccess('')
          setLoginPassword('')
          onClose()
        }, 600)
      } else {
        setLoginError(res.message || '로그인에 실패했습니다.')
      }
    } catch (err) {
      setLoginError('로그인 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // 3. 로그아웃
  const handleLogout = () => {
    storageService.logout()
    setCurrentUser(null)
  }

  // 4. 회원가입 처리 (Azure Cosmos DB 즉시 실시간 동기화)
  const handleRegister = async (e) => {
    e.preventDefault()
    setRegisterError('')

    const trimmedName = (newMember.name || '').trim()
    let cleanHandle = (newMember.handle || '').trim().toLowerCase().replace(/\s+/g, '_')
    cleanHandle = cleanHandle.replace(/[^a-z0-9_가-힣-]/g, '')

    if (!trimmedName) {
      setRegisterError('이름을 입력해 주세요.')
      return
    }

    if (!cleanHandle) {
      setRegisterError('아이디를 입력해 주세요.')
      return
    }

    if (!newMember.password || newMember.password.trim().length < 4) {
      setRegisterError('학번을 올바르게 입력해 주세요.')
      return
    }

    if (newMember.password !== newMember.passwordConfirm) {
      setRegisterError('학번과 학번 확인이 일치하지 않습니다.')
      return
    }

    const existing = storageService.getMember(cleanHandle)
    if (existing) {
      setRegisterError('이미 존재하는 아이디입니다.')
      return
    }

    setIsRegistering(true)
    try {
      const created = await storageService.addMember({
        ...newMember,
        name: trimmedName,
        handle: cleanHandle,
      })
      setMembers(storageService.getMembers())
      setCurrentUser(created)
      onClose()
    } catch (err) {
      setRegisterError(err.message || '클라우드 등록 중 오류가 발생했습니다.')
    } finally {
      setIsRegistering(false)
    }
  }

  const isLoginTab = tab === 'login'

  return (
    <Modal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="modal-panel relative w-full max-w-[460px] rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-2xl"
      >
        {/* 모달 상단 헤더: 깔끔하고 군더더기 없는 타이틀 */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3182F6]/10 text-[#3182F6] shrink-0">
              {isLoginTab ? <LogIn className="h-4.5 w-4.5" /> : <UserPlus className="h-4.5 w-4.5" />}
            </div>
            <h3 className="font-display text-base sm:text-lg font-bold text-fg">
              {isLoginTab ? '부원 로그인' : '신규 부원 가입'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-fg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 현재 접속 중인 계정 뱃지 */}
        {currentUser && (
          <div className="mt-3.5 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-line px-3 py-1.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-6 w-6 rounded-full object-cover border border-line shrink-0"
              />
              <span className="text-fg font-bold truncate">{currentUser.name}</span>
              <span className="text-muted text-[11px] truncate">@{currentUser.handle}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:underline shrink-0 ml-2"
            >
              <LogOut className="h-3 w-3" />
              로그아웃
            </button>
          </div>
        )}

        {/* Toss 스타일 슬라이딩 세그먼트 탭 */}
        <div className="mt-3.5 grid grid-cols-2 rounded-2xl bg-slate-100 dark:bg-white/[0.06] p-1 border border-line/60">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors duration-200 ${
              isLoginTab ? 'text-fg font-bold' : 'text-muted hover:text-fg'
            }`}
          >
            {isLoginTab && (
              <motion.div
                layoutId="authModalTabIndicator"
                className="absolute inset-0 rounded-xl bg-white dark:bg-surface border border-black/[0.05] dark:border-white/[0.08] shadow-xs"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-[#3182F6]" />
              로그인
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors duration-200 ${
              !isLoginTab ? 'text-fg font-bold' : 'text-muted hover:text-fg'
            }`}
          >
            {!isLoginTab && (
              <motion.div
                layoutId="authModalTabIndicator"
                className="absolute inset-0 rounded-xl bg-white dark:bg-surface border border-black/[0.05] dark:border-white/[0.08] shadow-xs"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-[#3182F6]" />
              신규 부원 가입
            </span>
          </button>
        </div>

        {/* TAB 1: 로그인 */}
        {isLoginTab && (
          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                아이디
              </label>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                value={loginHandle}
                onChange={(e) => {
                  setLoginHandle(e.target.value)
                  setLoginError('')
                }}
                className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                학번
              </label>
              <input
                type="password"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value)
                  setLoginError('')
                }}
                className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-500 flex items-center gap-1.5 font-medium pt-0.5">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                {loginError}
              </p>
            )}

            {loginSuccess && (
              <p className="text-xs text-[#3182F6] flex items-center gap-1.5 font-semibold pt-0.5">
                <Check className="h-3.5 w-3.5 shrink-0 text-[#3182F6]" />
                {loginSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-1 h-10.5 w-full rounded-xl bg-[#3182F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-xs sm:text-sm font-bold text-white shadow-sm shadow-[#3182F6]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoggingIn ? '로그인 확인 중...' : '로그인'}
            </button>
          </form>
        )}

        {/* TAB 2: 신규 부원 등록 */}
        {!isLoginTab && (
          <form onSubmit={handleRegister} noValidate className="mt-4 space-y-3 pr-0.5">
            {/* 프로필 사진 섹션 */}
            <div className="rounded-2xl border border-line bg-slate-50/70 dark:bg-white/[0.02] p-3">
              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <img
                    src={newMember.avatar || AVATAR_PRESETS[0]}
                    alt="avatar-preview"
                    className="h-11 w-11 rounded-full object-cover border-2 border-white dark:border-surface shadow-xs"
                  />
                  <label
                    htmlFor="register-avatar-file"
                    title="기기에서 사진 업로드"
                    className="absolute bottom-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#3182F6] text-white shadow-xs cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Camera className="h-2.5 w-2.5" />
                  </label>
                  <input
                    id="register-avatar-file"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-fg">프로필 사진</span>
                    <label
                      htmlFor="register-avatar-file"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3182F6] hover:underline cursor-pointer"
                    >
                      <Upload className="h-3 w-3" />
                      업로드
                    </label>
                  </div>

                  {/* 프리셋 컬러 칩 */}
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    {AVATAR_PRESETS.map((preset, idx) => {
                      const isSelected = newMember.avatar === preset
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewMember({ ...newMember, avatar: preset })}
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
                      value={newMember.avatar}
                      onChange={(e) => setNewMember({ ...newMember, avatar: e.target.value })}
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

            {/* 이름 & 아이디 (2열) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  이름 <span className="text-[#3182F6]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoCapitalize="words"
                  autoCorrect="off"
                  enterKeyHint="next"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  아이디 <span className="text-[#3182F6]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={newMember.handle}
                  onChange={(e) => setNewMember({ ...newMember, handle: e.target.value.toLowerCase().trim() })}
                  className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
                />
              </div>
            </div>

            {/* 학번 & 학번 확인 (2열) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  학번 <span className="text-[#3182F6]">*</span>
                </label>
                <input
                  type="password"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  학번 확인 <span className="text-[#3182F6]">*</span>
                </label>
                <input
                  type="password"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={newMember.passwordConfirm}
                  onChange={(e) => setNewMember({ ...newMember, passwordConfirm: e.target.value })}
                  className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
                />
              </div>
            </div>

            {/* 전공 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                전공
              </label>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                enterKeyHint="next"
                value={newMember.major}
                onChange={(e) => setNewMember({ ...newMember, major: e.target.value })}
                className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
              />
            </div>

            {/* 보유 MS 자격증 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                보유 MS 자격증
              </label>
              <input
                type="text"
                autoCapitalize="characters"
                autoCorrect="off"
                enterKeyHint="next"
                value={newMember.certifications}
                onChange={(e) => setNewMember({ ...newMember, certifications: e.target.value })}
                className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {['AI-900', 'AZ-900', 'DP-900', 'SC-900'].map((cert) => {
                  const currentList = newMember.certifications
                    ? newMember.certifications.split(',').map((s) => s.trim()).filter(Boolean)
                    : []
                  const isSelected = currentList.includes(cert)
                  return (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          const updated = currentList.filter((c) => c !== cert)
                          setNewMember({ ...newMember, certifications: updated.join(', ') })
                        } else {
                          setNewMember({ ...newMember, certifications: [...currentList, cert].join(', ') })
                        }
                      }}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#3182F6]/15 text-[#3182F6] border border-[#3182F6]/40 font-semibold shadow-2xs'
                          : 'bg-slate-100 dark:bg-white/[0.04] text-muted border border-line hover:border-[#3182F6]/40 hover:text-fg'
                      }`}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : '+'}
                      {cert}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* MS Learn Contributor ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  MS Learn Contributor ID
                </label>
                <span className="text-[10px] text-muted">(선택)</span>
              </div>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                value={newMember.contributorId}
                onChange={(e) => setNewMember({ ...newMember, contributorId: e.target.value })}
                placeholder="예: studentamb_482865 또는 482865"
                className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg placeholder:text-muted/50 transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
              />
            </div>

            {/* 한 줄 소개 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  한 줄 소개
                </label>
                <span className="text-[10px] text-muted">(선택)</span>
              </div>
              <input
                type="text"
                enterKeyHint="done"
                value={newMember.bio}
                onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                placeholder="부원들에게 보여줄 한 줄 소개를 적어주세요"
                className="w-full rounded-xl border border-line bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 sm:py-2 text-xs text-fg placeholder:text-muted/50 transition-all focus:bg-white dark:focus:bg-surface focus:border-[#3182F6] focus:ring-2 focus:ring-[#3182F6]/15 outline-none"
              />
            </div>

            {registerError && (
              <p className="text-xs text-rose-500 flex items-center gap-1.5 font-medium pt-0.5">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                {registerError}
              </p>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="mt-1.5 h-10.5 w-full rounded-xl bg-[#3182F6] hover:bg-[#2563EB] active:scale-[0.98] text-xs sm:text-sm font-bold text-white shadow-sm shadow-[#3182F6]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isRegistering ? '생성 중...' : '계정 생성'}
            </button>
          </form>
        )}
      </motion.div>
    </Modal>
  )
}
