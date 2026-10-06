import { useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

let locks = 0
let restore

export function useScrollLock(active = true) {
  useLayoutEffect(() => {
    if (!active) return
    if (locks++ === 0) {
      const body = document.body
      const root = document.documentElement
      const x = window.scrollX
      const y = window.scrollY
      const original = body.getAttribute('style')
      const overflow = root.style.overflow
      const behavior = root.style.scrollBehavior
      window.dispatchEvent(new CustomEvent('modal-scroll-lock', { detail: true }))
      const gap = window.innerWidth - root.clientWidth
      body.style.position = 'fixed'
      body.style.top = `-${y}px`
      body.style.left = `-${x}px`
      body.style.width = '100%'
      body.style.overflow = 'hidden'
      if (gap) body.style.paddingRight = `${gap}px`
      root.style.overflow = 'hidden'
      restore = () => {
        if (original === null) body.removeAttribute('style')
        else body.setAttribute('style', original)
        root.style.overflow = overflow
        root.style.scrollBehavior = 'auto'
        window.scrollTo(x, y)
        root.style.scrollBehavior = behavior
        window.dispatchEvent(new CustomEvent('modal-scroll-lock', { detail: false }))
      }
    }
    return () => {
      if (--locks === 0) restore?.()
    }
  }, [active])
}

export default function Modal({ children }) {
  useScrollLock()
  return createPortal(
    <div data-modal-root data-lenis-prevent role="dialog" aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overscroll-none">
      {children}
    </div>,
    document.body,
  )
}
