import { motion } from 'framer-motion'

const ease = [0.16, 1, 0.3, 1]

export function Reveal({ children, delay = 0, y = 12, className = '', once = true, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px 0px 60px 0px' }}
      transition={{ duration: 0.35, ease, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// background-clip:text 는 transform 된 자식 위에 그려지지 않으므로,
// 조각(단어/글자)마다 그라데이션을 직접 입히고 배경 위치를 이어 붙여 하나처럼 보이게 한다.
export function gradientSlice(i, n) {
  return {
    backgroundSize: `${n * 100}% 100%`,
    backgroundPosition: `${n > 1 ? (i / (n - 1)) * 100 : 0}% 0`,
  }
}

// 텍스트를 단어 단위로 부드럽게 등장 (모바일에서 클리핑되어 글씨가 사라지지 않도록 안전한 reveal 적용)
export function SplitWords({ text, className = '', delay = 0, stagger = 0.04, as = 'span', gradient = false }) {
  if (!text) return null
  const Comp = motion[as] ?? motion.span
  const words = String(text).trim().split(/\s+/)
  return (
    <Comp className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block align-bottom">
          <motion.span
            className={`inline-block ${gradient ? 'text-gradient pr-[0.04em]' : 'text-fg'}`}
            style={gradient ? gradientSlice(i, words.length) : undefined}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px 40px 0px' }}
            transition={{ duration: 0.45, ease, delay: delay + i * stagger }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </Comp>
  )
}

export function SectionHeading({ eyebrow, title, accent, desc, align = 'left', className = '' }) {
  const isCenter = align === 'center'
  const hasTitle = Boolean(title && String(title).trim())
  const hasAccent = Boolean(accent && String(accent).trim())

  return (
    <div className={`${isCenter ? 'mx-auto text-center' : ''} max-w-3xl ${className}`}>
      {eyebrow && (
        <Reveal className={`mb-5 flex items-center gap-3 ${isCenter ? 'justify-center' : ''}`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-mint animate-pulse-ring" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted/80">{eyebrow}</span>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {hasTitle && <span className="inline-block text-fg">{title}</span>}
          {hasTitle && hasAccent && ' '}
          {hasAccent && <span className="inline-block text-gradient pr-[0.04em]">{accent}</span>}
        </h2>
      </Reveal>
      {desc && (
        <Reveal delay={0.15} className="mt-6 text-base leading-relaxed text-muted sm:text-lg">
          {desc}
        </Reveal>
      )}
    </div>
  )
}
