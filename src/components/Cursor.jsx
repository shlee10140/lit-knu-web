import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

// 현대적인 고급 인터랙티브 포인터 팔로워 (Native 커서를 유지하여 지연 0ms 보장, 은은한 서클 아우라 제공)
export default function Cursor() {
  const [mounted, setMounted] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [isInput, setIsInput] = useState(false)
  const [visible, setVisible] = useState(false)

  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  // 반응성이 극대화된 가벼운 스프링 (지연 체감 없이 쫀득하게 마우스를 추적)
  const x = useSpring(mouseX, { stiffness: 450, damping: 36, mass: 0.15 })
  const y = useSpring(mouseY, { stiffness: 450, damping: 36, mass: 0.15 })

  useEffect(() => {
    const isFine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!isFine || reduce) return

    setMounted(true)

    const onMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      if (!visible) setVisible(true)
    }

    const onOver = (e) => {
      const inputEl = e.target.closest('input, textarea, select, [contenteditable="true"]')
      if (inputEl) {
        setIsInput(true)
        setHovered(false)
        return
      }
      setIsInput(false)

      const interactive = e.target.closest('a, button, [role="button"], [data-cursor], .spot, .spotlight-card')
      setHovered(Boolean(interactive))
    }

    const onLeave = () => {
      setVisible(false)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [mouseX, mouseY, visible])

  if (!mounted || !visible || isInput) return null

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full will-change-transform"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: hovered ? 46 : 22,
        height: hovered ? 46 : 22,
        opacity: visible ? 1 : 0,
        borderColor: hovered ? 'rgba(49, 130, 246, 0.6)' : 'rgba(49, 130, 246, 0.3)',
        borderWidth: hovered ? '1.5px' : '1px',
        borderStyle: 'solid',
        backgroundColor: hovered ? 'rgba(49, 130, 246, 0.08)' : 'rgba(49, 130, 246, 0.02)',
        boxShadow: hovered ? '0 0 16px rgba(49, 130, 246, 0.2)' : '0 0 0px transparent',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 28,
        mass: 0.15,
      }}
    />
  )
}
