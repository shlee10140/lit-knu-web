import { useEffect, useRef } from 'react'
import { animate, useInView } from 'framer-motion'
import { Reveal } from './ui/Primitives.jsx'
import { stats } from '../data/site.js'

function Counter({ value, suffix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toString()
      },
    })
    return () => controls.stop()
  }, [inView, value])
  return (
    <span className="font-sans text-6xl font-black tracking-tighter sm:text-7xl lg:text-8xl">
      <span ref={ref}>0</span>
      <span className="text-gradient">{suffix}</span>
    </span>
  )
}

export default function Stats() {
  return (
    <section className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="bg-bg">
              <div className="group relative h-full p-8 transition-colors duration-500 hover:bg-surface sm:p-10">
                <Counter value={s.value} suffix={s.suffix} />
                <p className="mt-5 font-semibold text-fg">{s.label}</p>
                <p className="mt-1 text-sm text-muted">{s.sub}</p>
                <span className="absolute inset-x-8 bottom-0 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,var(--color-pink),var(--color-mint))] transition-transform duration-500 group-hover:scale-x-100" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
