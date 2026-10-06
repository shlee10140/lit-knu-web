import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

// 마우스를 따라 살짝 끌려오는 버튼. as="a" 로 링크로도 사용 가능.
export default function MagneticButton({
  as = 'button',
  children,
  className = '',
  variant = 'primary',
  strength = 0.35,
  ...rest
}) {
  const ref = useRef(null)
  const rectRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  const onEnter = () => {
    if (ref.current) rectRef.current = ref.current.getBoundingClientRect()
  }
  const onMove = (e) => {
    const r = rectRef.current || (ref.current ? ref.current.getBoundingClientRect() : null)
    if (!r) return
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const onLeave = () => {
    rectRef.current = null
    x.set(0)
    y.set(0)
  }

  const base =
    'group relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold tracking-tight transition-colors duration-300 will-change-transform'
  const variants = {
    primary: 'bg-fg text-bg hover:opacity-95 shadow-xs active:scale-[0.98]',
    gradient:
      'text-bg bg-[linear-gradient(100deg,var(--color-pink),var(--color-violet),var(--color-mint))] bg-[length:200%_100%] hover:animate-shimmer active:scale-[0.98]',
    ghost: 'glass text-fg hover:bg-white/10 hover:border-white/20 active:scale-[0.98]',
  }

  const Comp = motion[as] ?? motion.button

  return (
    <Comp
      ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  )
}
