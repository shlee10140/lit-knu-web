import { useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import Lenis from 'lenis'

import Cursor from './components/Cursor.jsx'
import ScrollProgress from './components/ScrollProgress.jsx'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import Milestones from './components/Milestones.jsx'
import ArticleHub from './components/ArticleHub.jsx'
import Faq from './components/Faq.jsx'
import Footer from './components/Footer.jsx'

import AuthModal from './components/AuthModal.jsx'
import MemberProfileModal from './components/MemberProfileModal.jsx'
import ProfileModal from './components/ProfileModal.jsx'
import AdminAuditModal from './components/AdminAuditModal.jsx'
import { storageService } from './services/storageService.js'

export default function App() {
  const [ready, setReady] = useState(true)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [isAuditOpen, setIsAuditOpen] = useState(false)

  // 부원 프로필 상세 뷰 모달
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false)
  const [profileViewTarget, setProfileViewTarget] = useState(null)

  // 프로필 수정 모달
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)
  const [profileEditTarget, setProfileEditTarget] = useState(null)

  const [authorFilter, setAuthorFilter] = useState(null)

  // 고성능 버터리 스무스 스크롤 (Apple & Linear 관성 감속 커브 적용)
  // 모바일/터치 기기는 OS 네이티브 120Hz GPU 관성 스크롤을 사용하도록 하여 터치 지연과 버벅임 방지
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768
    if (isTouch) return

    const lenis = new Lenis({
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 0,
      infinite: false,
    })
    window.__lenis = lenis

    const handleScrollLock = (event) => {
      if (event.detail) lenis.stop()
      else lenis.start()
    }
    window.addEventListener('modal-scroll-lock', handleScrollLock)

    let id
    const raf = (time) => {
      if (!document.hidden) {
        lenis.raf(time)
      }
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)

    return () => {
      window.__lenis = null
      cancelAnimationFrame(id)
      window.removeEventListener('modal-scroll-lock', handleScrollLock)
      lenis.destroy()
    }
  }, [])

  // URL query parameter (?author=... 또는 ?member=...) 감지
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authorParam = params.get('author')
    const memberParam = params.get('member')

    if (authorParam) {
      setAuthorFilter(authorParam)
      setTimeout(() => {
        const el = document.getElementById('articles')
        if (el) {
          if (window.__lenis) {
            window.__lenis.scrollTo(el, { offset: -70, duration: 0.9 })
          } else {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }, 700)
    }

    if (memberParam) {
      const found = storageService.getMember(memberParam)
      if (found) {
        setProfileViewTarget(found)
        setIsProfileViewOpen(true)
      }
    }
  }, [])

  const handleFilterAuthor = (handle) => {
    setAuthorFilter(handle)
    setIsProfileViewOpen(false)
    setIsProfileEditOpen(false)
    setProfileViewTarget(null)

    // 모달 닫힘 및 바디 스크롤 락 해제 후 안전하게 LIT 피드로 스크롤 이동
    setTimeout(() => {
      const el = document.getElementById('articles')
      if (el) {
        if (window.__lenis) {
          window.__lenis.scrollTo(el, { offset: -70, duration: 0.9 })
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }, 150)
  }

  const handleClearAuthorFilter = () => {
    setAuthorFilter(null)
  }

  const handleOpenAuth = (tab = 'login') => {
    setAuthTab(tab)
    setIsAuthOpen(true)
  }

  // 프로필 상세 뷰 열기
  const handleOpenProfileView = (member = null) => {
    const target = member || storageService.getCurrentUser()
    if (!target) {
      handleOpenAuth('login')
      return
    }
    setProfileViewTarget(target)
    setIsProfileViewOpen(true)
  }

  const handleCloseProfileView = () => {
    setIsProfileViewOpen(false)
    setProfileViewTarget(null)
  }

  // 프로필 정보 수정 모달 열기
  const handleOpenProfileEdit = (member = null) => {
    const target = member || storageService.getCurrentUser()
    if (!target) {
      handleOpenAuth('login')
      return
    }
    setProfileEditTarget(target)
    setIsProfileEditOpen(true)
  }

  const handleCloseProfileEdit = () => {
    setIsProfileEditOpen(false)
    setProfileEditTarget(null)
  }

  return (
    <MotionConfig reducedMotion="user">
      <Cursor />
      <ScrollProgress />

      <Nav
        onOpenAuth={() => handleOpenAuth('login')}
        onOpenProfile={handleOpenProfileView}
        onOpenAudit={() => setIsAuditOpen(true)}
      />

      <main className="w-full max-w-[100vw] overflow-x-clip">
        <Hero ready={ready} />

        {/* 1. 챌린지 대시보드 (리더보드) */}
        <Leaderboard
          onFilterAuthor={handleFilterAuthor}
          onSelectMember={handleOpenProfileView}
          onOpenProfile={handleOpenProfileView}
          onEditMember={handleOpenProfileEdit}
          onOpenAuth={(tab) => handleOpenAuth(tab)}
        />

        {/* 3. 단계별 보상 */}
        <Milestones
          onOpenAuth={() => handleOpenAuth('login')}
        />

        {/* 4. 아티클 & 챌린지 링크 공유 피드 */}
        <ArticleHub
          authorFilter={authorFilter}
          onClearAuthorFilter={handleClearAuthorFilter}
          onFilterAuthor={handleFilterAuthor}
          onOpenAuth={() => handleOpenAuth('login')}
          onOpenProfile={handleOpenProfileView}
        />

        {/* 5. 챌린지 FAQ */}
        <Faq />
      </main>

      <Footer />

      {/* 모달 컴포넌트들 */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authTab}
      />

      {/* 부원 상세 프로필 뷰 */}
      <MemberProfileModal
        isOpen={isProfileViewOpen}
        onClose={handleCloseProfileView}
        member={profileViewTarget}
        onOpenEdit={(m) => handleOpenProfileEdit(m)}
        onFilterAuthor={handleFilterAuthor}
      />

      {/* 부원 정보/프로필 수정 폼 */}
      <ProfileModal
        isOpen={isProfileEditOpen}
        onClose={handleCloseProfileEdit}
        targetMember={profileEditTarget}
      />

      {/* 관리자 전용 인증 감사 모달 */}
      <AdminAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />
    </MotionConfig>
  )
}
