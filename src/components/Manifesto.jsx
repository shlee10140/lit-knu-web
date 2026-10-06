import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Reveal } from './ui/Primitives.jsx'
import TiltCard from './ui/TiltCard.jsx'
import { ddd } from '../data/site.js'

const statement =
  '빠르게 변하는 기술 앞에서, 우리는 배우는 데서 멈추지 않습니다. 직접 실습하고, 글과 발표로 기록하며, 세상에 기술을 전파합니다. LIT은 배움을 나누는 Tech Evangelist가 되는 곳입니다.'

const highlights = ['실습하고,', '기록하며,', '전파합니다.', 'Tech', 'Evangelist가']

function Word({ children, progress, range, highlight }) {
  const opacity = useTransform(progress, range, [0.12, 1])
  const y = useTransform(progress, range, [10, 0])
  return (
    <span className="relative mr-[0.28em] inline-block">
      <motion.span
        style={{ opacity, y }}
        className={`inline-block ${highlight ? 'text-gradient' : ''}`}
      >
        {children}
      </motion.span>
    </span>
  )
}

export default function Manifesto() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = statement.split(' ')

  return (
    <section id="about" className="relative scroll-mt-24 px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-10 flex items-center gap-3">
          <span className="h-px w-10 bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))]" />
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-muted">Manifesto</span>
        </Reveal>

        <p
          ref={ref}
          className="font-display text-3xl font-semibold leading-[1.25] tracking-tight text-fg sm:text-5xl sm:leading-[1.18] lg:text-6xl"
        >
          {words.map((w, i) => {
            const start = i / words.length
            const end = start + 1 / words.length
            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]} highlight={highlights.includes(w)}>
                {w}
              </Word>
            )
          })}
        </p>

        <div className="mt-24 grid gap-4 md:grid-cols-3 md:gap-5">
          {ddd.map((d, i) => (
            <Reveal key={d.key} delay={i * 0.12} className="h-full">
              <TiltCard className="group glass h-full rounded-3xl p-7 sm:p-8" data-cursor="hover">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs tracking-widest text-muted">0{i + 1}</span>
                  <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {d.ko}
                  </span>
                </div>
                <h3 className="mt-14 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  <span className="text-gradient">{d.key.slice(0, 1)}</span>
                  {d.key.slice(1)}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-[15px]">{d.desc}</p>
                <div className="mt-8 h-px w-full bg-gradient-to-r from-pink/60 via-violet/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </TiltCard>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.25em] text-muted">
          <span className="text-fg">DDD</span>
          <span>=</span>
          <span>Development</span>
          <span className="text-pink">·</span>
          <span>Delivery</span>
          <span className="text-mint">·</span>
          <span>Distribution</span>
        </Reveal>
      </div>
    </section>
  )
}
