'use client'
import { useEffect, useRef } from 'react'

export default function LowiHalo() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function update() {
      const scrolled = window.scrollY
      const total = document.body.scrollHeight - window.innerHeight || 1
      const p = Math.min(scrolled / total, 1)
      el!.style.left = `${50 + 28 * Math.sin(p * Math.PI * 2.5)}vw`
      el!.style.top  = `${30 + p * 50}vh`
    }

    el.style.transition = 'none'
    update()
    requestAnimationFrame(() => {
      el.style.transition = 'top 1s cubic-bezier(.25,.1,.25,1), left 1s cubic-bezier(.25,.1,.25,1)'
    })

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return <div ref={ref} className="lowi-halo" style={{ left: '50vw', top: '30vh' }} />
}
