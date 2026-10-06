import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Sparkles } from 'lucide-react'
import { getTheme, toggleTheme } from '../../services/themeService.js'

export default function ThemeFloatingSwitch() {
  const [theme, setThemeState] = useState(getTheme())

  useEffect(() => {
    const onThemeChange = (e) => setThemeState(e.detail.theme)
    window.addEventListener('lit-theme-change', onThemeChange)
    return () => window.removeEventListener('lit-theme-change', onThemeChange)
  }, [])

  const isLight = theme === 'light'

  return (
    <div className="fixed bottom-6 right-6 z-[60] select-none">
      <motion.button
        type="button"
        onClick={() => toggleTheme()}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glass group flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg transition-all border border-line hover:border-violet/40 bg-surface/90 backdrop-blur-xl text-fg"
        title={isLight ? '사이버펑크 다크 톤으로 전환' : '토스/애플 소프트 화이트 톤으로 전환'}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet/10 text-violet">
          {isLight ? <Sun className="h-3.5 w-3.5 text-amber" /> : <Moon className="h-3.5 w-3.5 text-violet" />}
        </span>
        <span className="hidden sm:inline-block">
          {isLight ? '소프트 화이트' : '사이버 다크'}
        </span>
        <span className="text-[10px] text-muted rounded-full bg-line/40 px-1.5 py-0.5 font-normal">
          전환
        </span>
      </motion.button>
    </div>
  )
}
