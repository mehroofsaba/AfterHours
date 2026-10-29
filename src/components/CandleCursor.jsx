import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

/**
 * A small candle that replaces the pointer on the landing page.
 * The flame sits exactly on the real pointer position, so clicks land where the flame is.
 * It never intercepts events, and it steps aside on touch devices and coarse pointers.
 */
export default function CandleCursor() {
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hot, setHot] = useState(false)
  const x = useMotionValue(-200), y = useMotionValue(-200)
  const sx = useSpring(x, { stiffness: 520, damping: 42, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 520, damping: 42, mass: 0.5 })

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setEnabled(fine.matches)
    update()
    fine.addEventListener?.('change', update)
    return () => fine.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('candle-cursor')
    const move = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') { setVisible(false); return }
      x.set(e.clientX); y.set(e.clientY)
      setVisible(true)
      setHot(!!e.target?.closest?.('a,button,[role="button"],input,select,textarea,summary'))
    }
    const leave = () => setVisible(false)
    const touch = () => setVisible(false)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    document.documentElement.addEventListener('mouseleave', leave)
    window.addEventListener('touchstart', touch, { passive: true })
    return () => {
      document.documentElement.classList.remove('candle-cursor')
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', move)
      document.removeEventListener('pointerleave', leave); document.documentElement.removeEventListener('mouseleave', leave)
      window.removeEventListener('touchstart', touch)
    }
  }, [enabled, x, y])

  if (!enabled) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[150] overflow-hidden" aria-hidden="true" style={{ opacity: visible ? 1 : 0, transition: 'opacity .3s ease' }}>
      {/* soft pool of candlelight around the flame */}
      <motion.div style={{ x: sx, y: sy }} className="absolute left-0 top-0">
        <div className="absolute rounded-full" style={{
          width: 440, height: 440, left: -220, top: -220, mixBlendMode: 'screen',
          background: 'radial-gradient(circle, rgba(244,196,128,.2) 0%, rgba(214,150,92,.1) 28%, rgba(150,80,60,.04) 52%, transparent 70%)',
          transform: `scale(${hot ? 1.22 : 1})`, transition: 'transform .45s cubic-bezier(.22,.8,.2,1)',
        }} />
        {/* candle: flame centre = pointer */}
        <svg width="30" height="62" viewBox="0 0 30 62" style={{ position: 'absolute', left: -15, top: -15, overflow: 'visible', transform: `scale(${hot ? 1.1 : 1})`, transformOrigin: '15px 15px', transition: 'transform .3s ease', filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.55))' }}>
          <defs>
            <linearGradient id="cc-wax" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#bfae88" /><stop offset=".45" stopColor="#efe3c4" /><stop offset="1" stopColor="#a8966e" /></linearGradient>
            <radialGradient id="cc-flame" cx="50%" cy="70%" r="60%"><stop offset="0" stopColor="#fff3d2" /><stop offset=".55" stopColor="#f6cf8a" /><stop offset="1" stopColor="#e39a55" /></radialGradient>
            <radialGradient id="cc-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#f6c987" stopOpacity=".6" /><stop offset="1" stopColor="#f6c987" stopOpacity="0" /></radialGradient>
          </defs>
          <circle cx="15" cy="13" r="15" fill="url(#cc-halo)" />
          <rect x="9" y="26" width="12" height="34" rx="1.5" fill="url(#cc-wax)" />
          <path d="M9 26c3 3 9 3 12 0v3c-3 3-9 3-12 0z" fill="#f4ead0" />
          <path d="M12 30c0 6-.5 14 0 20" stroke="#fff8e6" strokeOpacity=".55" strokeWidth="1.4" fill="none" />
          <line x1="15" y1="26" x2="15" y2="21" stroke="#2b1d16" strokeWidth="1.3" />
          <g className="flame" style={{ transformOrigin: '15px 21px' }}>
            <path d="M15 21C10 16 11.5 9 15 2c3.5 7 5 14 0 19z" fill="url(#cc-flame)" />
            <path d="M15 20c-2.4-3-2-7 0-10.5 2 3.500 2.400 7.500 0 10.500z" fill="#fff8e4" opacity=".9" />
          </g>
        </svg>
      </motion.div>
    </div>
  )
}
