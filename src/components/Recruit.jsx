import { motion } from 'framer-motion'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import MagneticButton from './ui/MagneticButton.jsx'
import { Reveal, SplitWords } from './ui/Primitives.jsx'
import { links, recruit } from '../data/site.js'

function dday(end) {
  const [y, m, d] = end.split('-').map(Number)
  const deadline = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((deadline - today) / 86400000)
}

export default function Recruit() {
  const d = dday(recruit.end)
  const openNow = d >= 0
  const fmt = (s) => s.replace(/-/g, '.')

  return (
    <section id="recruit" className="relative scroll-mt-24 px-6 pb-32 pt-10 sm:pb-40">
      <Reveal className="mx-auto max-w-6xl">
        <div className="gradient-border gradient-border-spin relative overflow-hidden rounded-[2.5rem] bg-surface">
          <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-pink/25 blur-[120px] animate-aurora" />
          <div className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-mint/20 blur-[130px] animate-aurora [animation-delay:-9s]" />
          <div className="pointer-events-none absolute inset-0 grid-bg mask-radial opacity-40" />

          <div className="relative grid gap-12 px-8 py-14 sm:px-14 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted">
                <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-mint' : 'bg-muted'}`} />
                  {openNow ? 'Recruiting' : 'Closed'}
                </span>
                <span>
                  {fmt(recruit.start)} – {fmt(recruit.end)}
                </span>
              </div>

              <h2 className="mt-8 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                <SplitWords text={`LIT ${recruit.generation}와`} />
                <br />
                <SplitWords text="함께 무대에" delay={0.1} />
                <br />
                <SplitWords text="오를 사람." gradient delay={0.2} />
              </h2>

              <p className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                발표 경험이 없어도 괜찮습니다. 배우고 싶은 기술 하나, 그리고 그걸 누군가에게 설명해 보고 싶은 마음만
                가져오세요. 나머지는 LIT이 함께합니다.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <MagneticButton
                  as="a"
                  href={links.apply}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="gradient"
                  className="!px-7 !py-4"
                >
                  지원서 작성하기
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </MagneticButton>
                <MagneticButton as="a" href={links.kakao} target="_blank" rel="noopener noreferrer" variant="ghost" className="!px-7 !py-4">
                  <MessageCircle className="h-4 w-4" />
                  오픈채팅으로 질문하기
                </MagneticButton>
              </div>
            </div>

            <div className="flex flex-col items-start gap-6 lg:items-end">
              <motion.div
                className="glass w-full rounded-3xl p-7 lg:max-w-xs"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
                  {openNow ? 'Deadline' : 'Next season'}
                </p>
                <p className="mt-3 font-sans text-6xl font-black tracking-tighter">
                  {openNow ? (
                    <>
                      D<span className="text-gradient">-{d === 0 ? 'DAY' : d}</span>
                    </>
                  ) : (
                    <span className="text-gradient">Soon</span>
                  )}
                </p>
                <p className="mt-3 text-sm text-muted">
                  {openNow ? `${recruit.endLabel} 마감` : '다음 모집은 인스타그램에서 가장 먼저 공지됩니다.'}
                </p>
              </motion.div>
              <ul className="grid w-full grid-cols-3 gap-3 text-center font-mono text-[11px] uppercase tracking-widest text-muted lg:max-w-xs">
                {['모든 학부', '모든 학년', '경험 무관'].map((t) => (
                  <li key={t} className="rounded-2xl border border-line py-3">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
