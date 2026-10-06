import { marquee } from '../data/site.js'

function Row({ items }) {
  // 3회 반복하여 끊김 없는 부드러운 무한 스크롤 구현
  const list = [...items, ...items, ...items]
  return (
    <div className="flex w-max animate-marquee will-change-transform">
      {list.map((t, i) => (
        <span
          key={i}
          className="flex items-center gap-7 pr-7 text-xs sm:text-[13px] font-medium tracking-wider uppercase select-none"
        >
          <span className={i % 2 === 0 ? 'text-gradient font-bold' : 'text-fg/75'}>
            {t}
          </span>
          <span className="text-muted/40 text-[9px]">✦</span>
        </span>
      ))}
    </div>
  )
}

export default function Marquee() {
  return (
    <div className="relative -mt-6 border-y border-line bg-surface/30 py-3.5 backdrop-blur-md">
      <div className="mask-fade-x overflow-hidden">
        <Row items={marquee} />
      </div>
    </div>
  )
}
