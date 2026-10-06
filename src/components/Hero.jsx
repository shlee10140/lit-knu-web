import { useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { BarChart3, Trophy, BookOpen } from 'lucide-react'
import MagneticButton from './ui/MagneticButton.jsx'
import { gradientSlice } from './ui/Primitives.jsx'
import { links } from '../data/site.js'

const ease = [0.16, 1, 0.3, 1]

function Letters({ text, className = '', gradient = false }) {
  return (
    <span className={`inline-block ${className} ${gradient ? 'text-gradient' : ''}`} aria-label={text}>
      {text}
    </span>
  )
}

export default function Hero({ ready }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 160])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.25])

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 40, damping: 20 })
  const py = useSpring(my, { stiffness: 40, damping: 20 })
  const blob1 = { x: useTransform(px, (v) => v * 40), y: useTransform(py, (v) => v * 40) }
  const blob2 = { x: useTransform(px, (v) => v * -60), y: useTransform(py, (v) => v * -30) }

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={onMove}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
    >
      {/* Aurora background */}
      <motion.div className="absolute inset-0 -z-10" style={{ scale: bgScale }}>
        <div className="absolute inset-0 grid-bg mask-radial opacity-70" />
        <motion.div
          style={blob1}
          className="absolute left-[10%] top-[10%] h-[48vw] w-[48vw] rounded-full bg-[radial-gradient(circle,rgba(255,111,177,0.35)_0%,transparent_70%)] blur-[24px] sm:blur-[60px] md:blur-[100px] animate-aurora will-change-transform"
        />
        <motion.div
          style={blob2}
          className="absolute right-[5%] top-[30%] h-[42vw] w-[42vw] rounded-full bg-[radial-gradient(circle,rgba(94,240,214,0.3)_0%,transparent_70%)] blur-[24px] sm:blur-[60px] md:blur-[100px] animate-aurora [animation-delay:-6s] [animation-duration:22s] will-change-transform"
        />
        <div className="absolute bottom-[-10%] left-[35%] h-[38vw] w-[38vw] rounded-full bg-[radial-gradient(circle,rgba(139,123,255,0.3)_0%,transparent_70%)] blur-[28px] sm:blur-[60px] md:blur-[110px] animate-aurora [animation-delay:-12s] [animation-duration:26s] will-change-transform" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--color-bg)_95%)]" />
      </motion.div>


      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 pb-28 pt-36 text-center"
      >
        <motion.a
          href="#dashboard"
          data-cursor="hover"
          className="group mb-8 inline-flex items-center justify-center rounded-full border border-pink/30 bg-surface/75 dark:bg-white/[0.05] px-5 py-2 text-xs font-semibold text-fg/90 shadow-[0_2px_14px_-2px_rgba(255,111,177,0.18)] backdrop-blur-xl hover:border-pink/60 hover:bg-surface hover:shadow-[0_6px_24px_-4px_rgba(255,111,177,0.35)] transition-colors duration-200"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="tracking-tight leading-none text-fg/90 font-semibold">LIT MSA 챌린지</span>
        </motion.a>

        <h1 className="font-display text-[14vw] font-extrabold leading-[0.92] tracking-[-0.04em] sm:text-[10vw] lg:text-[8.5rem]">
          <Letters text="Learn It," />
          <br />
          <Letters text="Teach." gradient className="pr-[0.08em]" />
        </h1>

        <motion.p
          className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease }}
        >
          경북대학교 IT 기술 발표 동아리, LIT
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14, ease }}
        >
          <MagneticButton as="a" href="#dashboard" variant="gradient" className="!px-7 !py-4">
            <BarChart3 className="h-4 w-4" />
            대시보드
          </MagneticButton>
          <MagneticButton as="a" href="#leaderboard" variant="ghost" className="!px-7 !py-4">
            <Trophy className="h-4 w-4" />
            리더보드
          </MagneticButton>
          <MagneticButton as="a" href="#articles" variant="ghost" className="!px-7 !py-4">
            <BookOpen className="h-4 w-4" />
            피드
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Bottom bar */}
      <motion.div
        className="relative mx-auto mb-8 flex w-full max-w-6xl items-end justify-center px-6 text-xs text-muted/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <a href="#dashboard" className="flex flex-col items-center gap-2" aria-label="아래로 스크롤">
          <span className="text-[11px] tracking-wider text-muted/70">둘러보기</span>
          <span className="relative h-10 w-px overflow-hidden bg-white/15">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-fg"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </a>
      </motion.div>
    </section>
  )
}
