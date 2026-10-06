import { motion } from 'framer-motion'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'
import { roadmap } from '../data/site.js'

export default function Roadmap() {
  return (
    <section id="roadmap" className="relative scroll-mt-24 px-6 py-28 sm:py-36">
      <div className="pointer-events-none absolute right-0 top-1/3 -z-10 h-[50vh] w-[50vw] rounded-full bg-pink/10 blur-[150px]" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Roadmap 2026"
          title="한 해의 리듬,"
          accent="한눈에."
          desc="학기 중에는 매달 Meetup, 방학에는 챌린지와 워크샵. 2027년부터는 이 운영 계획을 매 학기 반복합니다."
        />

        <div className="relative mt-16">
          <motion.div
            aria-hidden
            className="absolute left-0 top-[7px] hidden h-px w-full origin-left bg-[linear-gradient(90deg,var(--color-pink),var(--color-violet),var(--color-mint))] lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '0px 0px 40px 0px' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {roadmap.map((col, ci) => (
              <Reveal key={col.season} delay={ci * 0.08}>
                <div className="relative flex items-center gap-3">
                  <span className="relative flex h-[15px] w-[15px] items-center justify-center">
                    <span className="absolute h-full w-full rounded-full bg-fg/20" />
                    <span className="h-2 w-2 rounded-full bg-fg" />
                  </span>
                  <span className="relative bg-bg pr-3 font-mono text-xs uppercase tracking-[0.25em] text-muted">
                    {col.emoji} {col.season}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {col.items.map((it, i) => (
                    <motion.li
                      key={it.title + i}
                      data-cursor="hover"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '0px 0px 40px 0px' }}
                      transition={{ duration: 0.4, delay: 0.05 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      className={`group relative rounded-2xl border p-4 transition-colors duration-300 ${
                        it.hot
                          ? 'gradient-border gradient-border-spin border-transparent bg-surface'
                          : 'border-line bg-surface/60 hover:border-white/20 hover:bg-surface'
                      }`}
                    >
                      <div className="font-mono text-[11px] tracking-widest text-muted">{it.date}</div>
                      <div className={`mt-1.5 text-[15px] font-semibold ${it.hot ? 'text-gradient' : 'text-fg'}`}>{it.title}</div>
                      {it.hot && (
                        <span className="absolute right-4 top-4 rounded-full bg-pink/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-pink">
                          now
                        </span>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
