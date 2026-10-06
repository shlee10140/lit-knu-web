import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'
import useMediaQuery from '../hooks/useMediaQuery.js'
import { process } from '../data/site.js'

const modeColor = {
  'MS Learn': 'text-mint border-mint/30 bg-mint/10',
  'Hands-on': 'text-pink border-pink/30 bg-pink/10',
  'Writing': 'text-violet border-violet/30 bg-violet/10',
  'LIT Feed': 'text-amber border-amber/30 bg-amber/10',
  '🌱 30 달성': 'text-mint border-mint/30 bg-mint/10',
  '🌿 50 달성': 'text-amber border-amber/30 bg-amber/10',
  '🪴 100 달성': 'text-pink border-pink/30 bg-pink/10',
  '🌳 150 · 🍎 200': 'text-violet border-violet/30 bg-violet/10',
  '👑 250 MSA': 'text-amber border-amber/30 bg-amber/10',
}

function StepCard({ s, i, className = '' }) {
  return (
    <article
      data-cursor="hover"
      className={`group glass relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-7 transition-colors duration-500 hover:bg-white/[0.07] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-6xl font-extrabold leading-none text-outline transition-colors duration-500 group-hover:text-fg">
          {s.step}
        </span>
        <span
          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
            modeColor[s.mode] ?? 'border-line text-muted'
          }`}
        >
          {s.mode}
        </span>
      </div>
      <div className="mt-10">
        <h3 className="font-display text-2xl font-bold tracking-tight">{s.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">{s.desc}</p>
      </div>
      <div
        aria-hidden
        className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full opacity-0 blur-[70px] transition-opacity duration-700 group-hover:opacity-100"
        style={{ background: i % 2 ? 'var(--color-mint)' : 'var(--color-pink)' }}
      />
    </article>
  )
}

function Horizontal() {
  const targetRef = useRef(null)
  const trackRef = useRef(null)
  const [range, setRange] = useState(0)
  const [vh, setVh] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return
      const w = trackRef.current.scrollWidth
      setRange(Math.max(0, w - window.innerWidth + 96))
      setVh(window.innerHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(trackRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const { scrollYProgress } = useScroll({ target: targetRef, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 })
  const x = useTransform(smooth, [0, 1], [0, -range])
  const barScale = useTransform(scrollYProgress, [0, 1], [0.04, 1])
  const counter = useTransform(scrollYProgress, (v) =>
    String(Math.min(process.length, Math.max(1, Math.round(v * (process.length - 1)) + 1))).padStart(2, '0'),
  )

  return (
    <div ref={targetRef} style={{ height: range ? range + vh : '300vh' }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionHeading
            eyebrow="Roadmap to 250 Clicks"
            title="MSA 250 달성으로 가는"
            accent="8단계 여정"
            desc="혼자 달리지 않습니다. 학습부터 아티클 기고, 체크포인트 돌파와 최종 공식 인증까지 LIT이 함께합니다."
          />
        </div>

        <motion.div ref={trackRef} style={{ x }} className="mt-14 flex w-max items-stretch gap-5 pl-6 pr-24 sm:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
          {process.map((s, i) => (
            <div key={s.step} className="relative flex items-stretch">
              <StepCard s={s} i={i} className="w-[340px] lg:w-[380px]" />
              {i < process.length - 1 && (
                <div className="flex w-5 items-center justify-center">
                  <span className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" />
                </div>
              )}
            </div>
          ))}
          <div className="glass flex w-[300px] flex-col items-start justify-center rounded-3xl p-8">
            <p className="font-display text-3xl font-bold leading-tight">
              그리고, <span className="text-gradient">250 달성</span>
              <br />
              공식 앰버서더로.
            </p>
            <a
              href="#dashboard"
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
            >
              내 챌린지 시작하기 <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>

        <div className="mx-auto mt-12 flex w-full max-w-6xl items-center gap-6 px-6">
          <div className="h-px flex-1 overflow-hidden bg-white/10">
            <motion.div
              style={{ scaleX: barScale }}
              className="h-full w-full origin-left bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))]"
            />
          </div>
          <div className="font-mono text-xs tracking-widest text-muted">
            <motion.span className="text-fg">{counter}</motion.span> / {String(process.length).padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  )
}

function Vertical() {
  return (
    <div className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Roadmap to 250 Clicks"
          title="MSA 250 달성으로 가는"
          accent="8단계 여정"
          desc="혼자 달리지 않습니다. 학습부터 아티클 기고, 체크포인트 돌파와 최종 공식 인증까지 LIT이 함께합니다."
        />
        <div className="relative mt-12 space-y-4 before:absolute before:left-6 before:top-0 before:h-full before:w-px before:bg-white/10">
          {process.map((s, i) => (
            <Reveal key={s.step} delay={0.05 * i} className="relative pl-14">
              <span className="absolute left-[19px] top-8 h-2.5 w-2.5 rounded-full bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))] ring-4 ring-bg" />
              <StepCard s={s} i={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Process() {
  const desktop = useMediaQuery('(min-width: 1024px)')
  return (
    <section id="process" className="relative scroll-mt-24">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[50vh] bg-[radial-gradient(ellipse_at_center,rgba(139,123,255,0.12),transparent_70%)]" />
      {desktop ? <Horizontal /> : <Vertical />}
    </section>
  )
}
