import { motion } from 'framer-motion'
import { Award, BadgeCheck, BookOpen, Briefcase, Mic2, Radio, Trophy, Users, ArrowUpRight } from 'lucide-react'
import { SectionHeading } from './ui/Primitives.jsx'
import { activities } from '../data/site.js'

const icons = { Award, BadgeCheck, BookOpen, Briefcase, Mic2, Radio, Trophy, Users }
const accents = {
  pink: 'text-pink bg-pink/10 border-pink/20',
  mint: 'text-mint bg-mint/10 border-mint/20',
  violet: 'text-violet bg-violet/10 border-violet/20',
  amber: 'text-amber bg-amber/10 border-amber/20',
}

function Card({ item, index }) {
  const Icon = icons[item.icon] ?? Mic2
  const big = item.span.includes('row-span-2')
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <motion.article
      onMouseMove={onMove}
      data-cursor="hover"
      className={`spot group glass flex flex-col justify-between rounded-3xl p-6 sm:p-7 ${item.span} ${big ? 'min-h-[380px]' : 'min-h-[220px]'}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px 40px 0px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: (index % 4) * 0.04 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between">
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${accents[item.accent]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
          {item.tag}
        </span>
      </div>

      <div className={big ? 'mt-16' : 'mt-8'}>
        <h3 className={`font-display font-bold tracking-tight ${big ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
          {item.title}
        </h3>
        <p className={`mt-3 leading-relaxed text-muted ${big ? 'max-w-md text-[15px] sm:text-base' : 'text-sm'}`}>
          {item.desc}
        </p>
      </div>

      {big && (
        <div className="pointer-events-none absolute -bottom-16 -right-10 select-none font-display text-[13rem] font-extrabold leading-none text-outline opacity-40 transition-transform duration-700 group-hover:-translate-y-3">
          M
        </div>
      )}
      <ArrowUpRight className="absolute right-6 top-6 h-4 w-4 translate-y-1 text-muted opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:hidden" />
    </motion.article>
  )
}

export default function Activities() {
  return (
    <section id="activities" className="relative scroll-mt-24 px-6 py-28 sm:py-36">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-violet/10 blur-[140px]" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="What we do"
          title="배우는 방식은 자유,"
          accent="무대는 매달."
          desc="스터디에서 시작해 자격증과 MSA까지. 모든 활동은 결국 하나의 발표 컨텐츠로 모입니다."
        />
        <div className="mt-16 grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 md:grid-cols-4">
          {activities.map((a, i) => (
            <Card key={a.title} item={a} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
