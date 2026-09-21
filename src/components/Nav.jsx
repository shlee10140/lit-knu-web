import { useState, useEffect } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import {
  ArrowUpRight,
  LogIn,
  Menu,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react'
import Logo from './ui/Logo.jsx'
import MagneticButton from './ui/MagneticButton.jsx'
import { links, nav } from '../data/site.js'
import { storageService } from '../services/storageService.js'

export default function Nav({ onOpenAuth, onOpenProfile }) {
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()

  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser())
  const [isAdmin, setIsAdmin] = useState(storageService.isAdmin())

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser())
      setIsAdmin(storageService.isAdmin())
    })
    return unsub
  }, [])

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setHidden(y > prev && y > 160 && !open)
    setScrolled(y > 40)
  })

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-[70] flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: hidden ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: hidden ? 0 : 0.1 }}
      >
        <nav
          className={`flex w-full max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2 pl-4 sm:pl-5 transition-all duration-500 ${
            scrolled ? 'glass shadow-[0_10px_40px_-15px_rgba(0,0,0,0.7)]' : 'border border-transparent'
          }`}
        >
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2" data-cursor="hover" aria-label="LIT 홈">
            <Logo className="text-2xl sm:text-3xl" />
          </a>

          {/* Desktop Nav Links */}
          <ul className="hidden items-center gap-0.5 lg:flex">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="group relative rounded-full px-3 py-1.5 text-xs text-muted transition-colors hover:text-fg"
                >
                  {item.label}
                  <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))] transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          {/* User Account & Actions bar */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenProfile?.(currentUser)}
                  title="내 프로필 및 클릭수 수정"
                  className="glass group flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-xs text-fg transition-colors hover:border-pink/40"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-6 w-6 rounded-full object-cover border border-line"
                  />
                  <span className="font-semibold max-w-[75px] sm:max-w-none truncate">{currentUser.name}</span>
                  <span className="rounded-full bg-pink/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-pink">
                    {currentUser.clicks || 0}
                  </span>
                </button>

                {isAdmin && (
                  <span
                    title="관리자 권한 활성화됨"
                    className="hidden sm:inline-flex items-center gap-1 rounded-full border border-pink/40 bg-pink/15 px-2 py-0.5 font-mono text-[10px] text-pink"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </span>
                )}

                <button
                  onClick={onOpenAuth}
                  className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted transition-colors hover:text-fg hover:border-white/30"
                  title="부원 계정 전환 및 관리자 로그인"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">계정</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))] px-3.5 py-1.5 text-xs font-bold text-bg shadow-sm transition-transform hover:scale-105"
                title="부원 로그인 / 참가하기"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>로그인</span>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              className="glass flex h-9 w-9 items-center justify-center rounded-full lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="메뉴"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col justify-end bg-bg/90 px-6 pb-10 pt-28 backdrop-blur-2xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <ul className="flex flex-col gap-3">
              {nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block font-display text-4xl font-bold tracking-tight text-fg"
                  >
                    {item.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
