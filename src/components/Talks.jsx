import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Github } from 'lucide-react'
import { Reveal, SectionHeading } from './ui/Primitives.jsx'
import { links, talks } from '../data/site.js'

export default function Talks() {
  const wrapRef = useRef(null)
  const trackRef = useRef(null)
  const [limit, setLimit] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (!wrapRef.current || !trackRef.current) return
      setLimit(Math.max(0, trackRef.current.scrollWidth - wrapRef.current.offsetWidth))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <section id="talks" className="relative scroll-mt-24 overflow-hidden py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Recent talks"
            title="이런 걸"
            accent="발표했어요."
            desc="AI · 클라우드 · 보안 · DevOps. 모든 세션의 데모 코드와 슬라이드는 LIT GitHub에서 열람할 수 있습니다."
          />
          <Reveal delay={0.2}>
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="glass group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm text-fg transition-colors hover:bg-white/10"
            >
              <Github className="h-4 w-4" />
              github.com/LITofficial
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Reveal>
        </div>
      </div>

      <div ref={wrapRef} className="mt-14 px-6" data-cursor="drag" data-cursor-label="drag">
        <motion.div
          ref={trackRef}
          drag="x"
          dragConstraints={{ left: -limit, right: 0 }}
          dragElastic={0.08}
          dragTransition={{ power: 0.25, timeConstant: 220 }}
          className="flex w-max cursor-grab gap-5 active:cursor-grabbing sm:pl-[max(0px,calc((100vw-72rem)/2))]"
        >
          {talks.map((t, i) => (
            <motion.article
              key={t.title}
              className="group relative flex h-[420px] w-[300px] shrink-0 select-none flex-col justify-between overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:w-[340px]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px 40px 0px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: (i % 3) * 0.05 }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-70 transition-transform duration-700 group-hover:scale-110`}
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.12),transparent_55%)]" />
              <div className="pointer-events-none absolute -bottom-10 -right-4 select-none font-display text-[9rem] font-extrabold leading-none text-white/[0.06]">
                {t.month}
              </div>

              <div className="relative flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-fg/70">
                <span>{t.month} · Meetup</span>
                <span>#{String(i + 1).padStart(2, '0')}</span>
              </div>

              <div className="relative">
                <h3 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-[1.7rem]">{t.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 font-mono text-[10px] tracking-wider text-fg/80 backdrop-blur">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>

      <Reveal className="mx-auto mt-6 max-w-6xl px-6 font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
        ← drag to explore →
      </Reveal>
    </section>
  )
}
