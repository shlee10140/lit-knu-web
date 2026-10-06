import { useEffect, useState } from 'react'
import { useScrollLock } from './ui/Modal.jsx'
import { AnimatePresence, motion } from 'framer-motion'

export default function Preloader({ onDone }) {
  const [show, setShow] = useState(true)

  const [locked, setLocked] = useState(true)
  useScrollLock(locked)

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1700)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence
      onExitComplete={() => {
        setLocked(false)
        onDone?.()
      }}
    >
      {show && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-bg"
          exit={{ y: '-100%', transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
        >
          <div className="relative flex flex-col items-center justify-center text-center">
            <motion.p
              className="font-mono text-xs sm:text-sm uppercase tracking-[0.35em] pl-[0.35em] text-fg/80 text-center select-none"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Learn It, Teach
            </motion.p>
            <div className="mt-6 h-1 w-44 sm:w-48 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full w-full origin-left bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.3, ease: 'easeInOut', delay: 0.15 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
