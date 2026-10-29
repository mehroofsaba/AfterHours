import { useEffect, useId, useMemo, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { seeded } from '../lib/utils.js'

/* ───────── small ornaments ───────── */
export function Ornament({ className = '', size = 18 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M12 2l1.8 8.2L22 12l-8.2 1.8L12 22l-1.8-8.2L2 12l8.2-1.8z" />
    </svg>
  )
}
export function WaxSeal({ size = 64, broken = false, className = '', letter = 'A' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={`w${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#8a4656" /><stop offset=".55" stopColor="#5c2d39" /><stop offset="1" stopColor="#331720" />
        </radialGradient>
      </defs>
      <path fill={`url(#w${id})`} d="M50 6c7 0 9 6 15 8 7 2 14-1 18 5 4 6 0 12 2 19 2 6 9 9 8 17-1 7-8 9-10 15-3 7 0 14-7 18-6 3-12-1-18 1-7 2-11 8-19 6-7-2-8-9-13-13-6-5-14-5-15-13-1-8 6-11 7-18 1-7-4-13 0-20 4-6 11-4 17-6 7-2 9-12 15-12z" />
      <circle cx="50" cy="52" r="29" fill="none" stroke="#a77d83" strokeOpacity=".5" strokeWidth="1.5" />
      <circle cx="50" cy="52" r="24" fill="none" stroke="#1f0d13" strokeOpacity=".5" strokeWidth="1" />
      <path d="M50 20c8 4 12 4 20 4M50 84c-8-4-12-4-20-4" stroke="#a77d83" strokeOpacity=".25" fill="none" />
      <text x="50" y="62" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="34" fontWeight="600" fill="#a77d83" fillOpacity=".75">{letter}</text>
      <ellipse cx="38" cy="30" rx="14" ry="7" fill="#fff" opacity=".1" transform="rotate(-28 38 30)" />
      {broken && <path d="M50 8L44 36 56 50 46 70 54 96" stroke="#150a0e" strokeWidth="2.5" fill="none" />}
    </svg>
  )
}

/* ───────── hero scene ───────── */
function Spines({ x, y, w, h, seed, tilt = false }) {
  const rand = useMemo(() => seeded(seed), [seed])
  const cols = ['#542b35', '#3a1d25', '#4a2f26', '#2b1d1a', '#5b3a2e', '#6a5440', '#7a5a3a', '#33241f', '#6d3846']
  const els = useMemo(() => {
    const out = []; let cx = x
    while (cx < x + w - 14) {
      const bw = 16 + rand() * 24, bh = h * (0.72 + rand() * 0.28)
      const c = cols[Math.floor(rand() * cols.length)]
      out.push({ cx, bw, bh, c, band: rand() > 0.55, lean: tilt && rand() > 0.9 })
      cx += bw + 1.5
    }
    return out
  }, [x, w, h, rand, tilt])
  return (
    <g>
      {els.map((b, i) => (
        <g key={i} transform={b.lean ? `rotate(6 ${b.cx + b.bw / 2} ${y + h})` : undefined}>
          <rect x={b.cx} y={y + h - b.bh} width={b.bw} height={b.bh} fill={b.c} />
          <rect x={b.cx} y={y + h - b.bh} width={b.bw} height={b.bh} fill="url(#spineShade)" />
          {b.band && <rect x={b.cx} y={y + h - b.bh + 14} width={b.bw} height="3" fill="#a9a4a0" opacity=".38" />}
          {b.band && <rect x={b.cx} y={y + h - 22} width={b.bw} height="2" fill="#a9a4a0" opacity=".28" />}
        </g>
      ))}
    </g>
  )
}

export function HeroScene({ ambient = true }) {
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 18 }), sy = useSpring(my, { stiffness: 40, damping: 18 })
  const backX = useTransform(sx, (v) => v * -8), backY = useTransform(sy, (v) => v * -4)
  const frontX = useTransform(sx, (v) => v * 16), frontY = useTransform(sy, (v) => v * 8)
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5)
  }
  return (
    <div className={`absolute inset-0 overflow-hidden ${ambient ? '' : 'ambient-off'}`} onPointerMove={onMove} aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#120c0c" /><stop offset=".6" stopColor="#201513" /><stop offset="1" stopColor="#171010" /></linearGradient>
          <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2822" /><stop offset=".25" stopColor="#2a1c18" /><stop offset="1" stopColor="#140d0c" /></linearGradient>
          <linearGradient id="spineShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity=".45" /><stop offset=".35" stopColor="#fff" stopOpacity=".07" /><stop offset="1" stopColor="#000" stopOpacity=".5" /></linearGradient>
          <linearGradient id="curtain" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1d0c12" /><stop offset=".12" stopColor="#4a2330" /><stop offset=".25" stopColor="#2a1118" /><stop offset=".4" stopColor="#52283a" />
            <stop offset=".55" stopColor="#2a1118" /><stop offset=".72" stopColor="#4a2330" /><stop offset=".86" stopColor="#24101a" /><stop offset="1" stopColor="#3d1c28" />
          </linearGradient>
          <radialGradient id="candleGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#f2c98a" stopOpacity=".55" /><stop offset=".25" stopColor="#c98a56" stopOpacity=".22" /><stop offset="1" stopColor="#7a3a2a" stopOpacity="0" /></radialGradient>
          <radialGradient id="moonGlow" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="#a9a4a0" stopOpacity=".28" /><stop offset="1" stopColor="#a9a4a0" stopOpacity="0" /></radialGradient>
          <linearGradient id="paperG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e6d9b8" /><stop offset="1" stopColor="#bda878" /></linearGradient>
          <linearGradient id="brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6e6864" /><stop offset=".5" stopColor="#b9b4ae" /><stop offset="1" stopColor="#6e6864" /></linearGradient>
          <filter id="blur6"><feGaussianBlur stdDeviation="6" /></filter>
          <filter id="blur2"><feGaussianBlur stdDeviation="1.6" /></filter>
        </defs>

        <rect width="1600" height="900" fill="url(#wall)" />

        {/* back layer: shelves, window */}
        <motion.g style={{ x: backX, y: backY }}>
          <g opacity=".95">
            <rect x="250" y="120" width="560" height="470" fill="#160e0d" stroke="#3a2822" strokeWidth="2" />
            {[0, 1, 2].map((r) => (
              <g key={r}>
                <Spines x={262} y={140 + r * 150} w={536} h={118} seed={11 + r * 7} tilt />
                <rect x="250" y={258 + r * 150} width="560" height="12" fill="#2f211c" />
                <rect x="250" y={270 + r * 150} width="560" height="3" fill="#000" opacity=".5" />
              </g>
            ))}
          </g>
          {/* arched window */}
          <g transform="translate(1010 150)">
            <ellipse cx="90" cy="260" rx="260" ry="320" fill="url(#moonGlow)" />
            <path d="M0 400V120a90 90 0 0 1 180 0V400z" fill="#15131a" stroke="#4a3a35" strokeWidth="6" />
            <path d="M8 392V120a82 82 0 0 1 164 0V392z" fill="#1c1a22" />
            <circle cx="112" cy="96" r="26" fill="#a9a4a0" opacity=".55" />
            <circle cx="122" cy="90" r="24" fill="#1c1a22" />
            <path d="M90 38V392M8 190H172M8 290H172" stroke="#3a2d29" strokeWidth="4" />
            <rect x="-14" y="396" width="208" height="14" fill="#33241f" />
          </g>
        </motion.g>

        {/* curtains */}
        <g>
          <path d="M0 0h300c-24 140-6 420-40 900H0z" fill="url(#curtain)" />
          <path d="M1600 0h-250c20 140 4 420 34 900h216z" fill="url(#curtain)" opacity=".9" />
          <rect x="0" y="0" width="1600" height="44" fill="#1a0b10" opacity=".85" />
          <path d="M0 44c200 40 400 40 600 0s400-40 600 0 300 40 400 20V0H0z" fill="#2a1118" opacity=".7" />
          <rect width="1600" height="900" fill="#000" opacity=".12" />
        </g>

        {/* desk */}
        <rect x="0" y="650" width="1600" height="250" fill="url(#desk)" />
        <rect x="0" y="648" width="1600" height="4" fill="#4a3730" opacity=".7" />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M0 ${690 + i * 38}C400 ${684 + i * 38} 1200 ${698 + i * 38} 1600 ${690 + i * 38}`} stroke="#000" strokeOpacity=".28" fill="none" />)}

        {/* candle light on wall and desk */}
        <g>
          <circle cx="560" cy="560" r="420" fill="url(#candleGlow)" />
          <ellipse cx="640" cy="760" rx="520" ry="120" fill="url(#candleGlow)" opacity=".7" />
        </g>

        {/* front layer */}
        <motion.g style={{ x: frontX, y: frontY }}>
          {/* books stack left */}
          <g transform="translate(250 600)">
            <rect x="0" y="40" width="210" height="30" rx="2" fill="#4a2f26" /><rect x="0" y="40" width="210" height="30" fill="url(#spineShade)" opacity=".6" />
            <rect x="8" y="46" width="194" height="3" fill="#a9a4a0" opacity=".4" /><rect x="8" y="60" width="194" height="3" fill="#a9a4a0" opacity=".25" />
            <rect x="14" y="10" width="190" height="30" rx="2" fill="#542b35" /><rect x="14" y="10" width="190" height="30" fill="url(#spineShade)" opacity=".6" />
            <rect x="22" y="16" width="174" height="3" fill="#a9a4a0" opacity=".4" />
            <rect x="4" y="-18" width="184" height="28" rx="2" fill="#2b1d1a" /><rect x="4" y="-18" width="184" height="28" fill="url(#spineShade)" opacity=".6" />
            <rect x="12" y="-12" width="168" height="3" fill="#a9a4a0" opacity=".35" />
          </g>
          {/* candlestick */}
          <g transform="translate(560 430)">
            <ellipse cx="0" cy="214" rx="52" ry="9" fill="#000" opacity=".5" />
            <path d="M-46 208c2-14 20-16 46-16s44 2 46 16c-10 6-82 6-92 0z" fill="url(#brass)" />
            <rect x="-6" y="110" width="12" height="86" fill="url(#brass)" />
            <ellipse cx="0" cy="150" rx="12" ry="5" fill="url(#brass)" />
            <path d="M-28 110c0-8 12-12 28-12s28 4 28 12z" fill="url(#brass)" />
            <rect x="-14" y="2" width="28" height="108" fill="#d8c8a8" /><rect x="-14" y="2" width="28" height="108" fill="url(#spineShade)" opacity=".5" />
            <path d="M-14 2c8 8 16 4 28 0v6c-12 8-20 6-28 0z" fill="#efe3c6" />
            <path d="M-12 24c-2 24-1 54 0 70" stroke="#efe3c6" strokeWidth="3" opacity=".7" fill="none" />
            <line x1="0" y1="2" x2="0" y2="-8" stroke="#1a1210" strokeWidth="2" />
            <g>
              <ellipse cx="0" cy="-30" rx="26" ry="36" fill="#f2b265" opacity=".25" filter="url(#blur6)" />
              <path d="M0 -8C-11 -20-9 -36 0 -58 9 -36 11 -20 0 -8z" fill="#f6d9a2" />
              <path d="M0 -9C-5 -18-4 -30 0 -42 4 -30 5 -18 0 -9z" fill="#fff4d8" />
            </g>
          </g>
          {/* envelope + seal */}
          <g transform="translate(660 700) rotate(-5) scale(.82)">
            <rect x="0" y="0" width="380" height="210" rx="3" fill="#000" opacity=".4" transform="translate(8 12)" filter="url(#blur6)" />
            <rect x="0" y="0" width="380" height="210" rx="3" fill="url(#paperG)" />
            <path d="M0 0L190 120 380 0" fill="#cdbb94" stroke="#a89468" strokeOpacity=".6" />
            <path d="M0 210L150 108M380 210L230 108" stroke="#a89468" strokeOpacity=".5" fill="none" />
            <rect x="0" y="0" width="380" height="210" rx="3" fill="#5a3a1a" opacity=".12" />
            <g transform="translate(190 112)"><WaxSeal size={64} className="" /></g>
          </g>
          {/* quill + ink */}
          <g transform="translate(1110 660) scale(.9)">
            <path d="M0 140C80 90 190 30 280 0c-30 40-90 90-200 140z" fill="#d8c8a8" opacity=".85" />
            <path d="M0 140L290 -2" stroke="#6a5440" strokeWidth="2" />
            <g transform="translate(-60 70)"><ellipse cx="0" cy="40" rx="34" ry="8" fill="#000" opacity=".5" /><path d="M-30 40c0-26 8-40 30-40s30 14 30 40z" fill="#1c1514" stroke="#a9a4a0" strokeOpacity=".4" /></g>
          </g>
          {/* rose */}
          <g transform="translate(1260 740)" opacity=".92">
            <ellipse cx="0" cy="30" rx="40" ry="8" fill="#000" opacity=".5" />
            <circle cx="0" cy="0" r="24" fill="#4a1d2a" /><circle cx="0" cy="0" r="17" fill="#5c2535" /><circle cx="0" cy="0" r="10" fill="#6d2d40" /><circle cx="0" cy="0" r="4" fill="#3a1520" />
            <path d="M-24 -4c4-20 24-26 36-14M24 4c-4 20-24 26-36 14" stroke="#2a0f18" strokeWidth="2" fill="none" />
          </g>
        </motion.g>
        <rect width="1600" height="900" fill="url(#wall)" opacity=".0" />
      </svg>
      <Dust active={ambient} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(23,19,19,.5), rgba(23,19,19,.82) 85%), linear-gradient(180deg, rgba(23,19,19,.55), transparent 25%, transparent 70%, rgba(23,19,19,.85))' }} />
    </div>
  )
}

/* ───────── dust motes ───────── */
export function Dust({ active = true, count = 38 }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = c.getContext('2d')
    let w = 0, h = 0, raf, running = true
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    resize()
    const motes = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.6, vx: (Math.random() - 0.5) * 0.00006, vy: -0.00003 - Math.random() * 0.00005, p: Math.random() * 6.28 }))
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h)
      motes.forEach((m) => {
        if (active && !reduce) { m.x += m.vx * 16 + Math.sin(t / 2400 + m.p) * 0.00004 * 16; m.y += m.vy * 16 }
        if (m.y < -0.02) { m.y = 1.02; m.x = Math.random() }
        if (m.x < -0.02) m.x = 1.02; if (m.x > 1.02) m.x = -0.02
        ctx.globalAlpha = 0.12 + 0.28 * (0.5 + 0.5 * Math.sin(t / 1800 + m.p))
        ctx.fillStyle = '#d8c8a8'
        ctx.beginPath(); ctx.arc(m.x * w, m.y * h, m.r, 0, 6.283); ctx.fill()
      })
      if (running && active && !reduce) raf = requestAnimationFrame(draw)
    }
    draw(0)
    const vis = () => { if (document.hidden) cancelAnimationFrame(raf); else if (active && !reduce) raf = requestAnimationFrame(draw) }
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('resize', resize)
    return () => { running = false; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); window.removeEventListener('resize', resize) }
  }, [active, count])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
}

/* ───────── room artwork ───────── */
export function CabinetArt({ className = '' }) {
  const rows = [0, 1, 2], cols = [0, 1]
  return (
    <svg viewBox="0 0 300 400" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="cabBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b1211" /><stop offset="1" stopColor="#120b0b" /></linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a3029" /><stop offset=".5" stopColor="#35231e" /><stop offset="1" stopColor="#2a1b17" /></linearGradient>
        <linearGradient id="woodDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2b1c18" /><stop offset="1" stopColor="#1e1311" /></linearGradient>
        <radialGradient id="cabGlow" cx="30%" cy="12%" r="70%"><stop offset="0" stopColor="#c98a56" stopOpacity=".38" /><stop offset="1" stopColor="#c98a56" stopOpacity="0" /></radialGradient>
        <linearGradient id="silverG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9d4cf" /><stop offset="1" stopColor="#6e6864" /></linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#cabBg)" />
      <rect x="44" y="96" width="212" height="260" rx="4" fill="url(#woodDark)" stroke="#5b4036" />
      <rect x="36" y="86" width="228" height="14" rx="3" fill="url(#wood)" stroke="#5b4036" />
      <rect x="40" y="352" width="220" height="14" rx="2" fill="url(#wood)" />
      {rows.map((r) => cols.map((c) => {
        const x = 54 + c * 100, y = 108 + r * 80, open = r === 1 && c === 1
        return (
          <g key={`${r}${c}`}>
            {open && <>
              <path d={`M${x + 6} ${y + 6}h80v30h-80z`} fill="#0d0808" />
              <path d={`M${x + 12} ${y + 14}l62-9 4 8-62 9zM${x + 10} ${y + 22}l66-4 2 7-66 4z`} fill="#d8c8a8" opacity=".85" />
            </>}
            <rect x={x} y={y + (open ? 26 : 0)} width="92" height="68" rx="3" fill="url(#wood)" stroke="#6a4c40" strokeWidth="1" />
            <rect x={x + 6} y={y + (open ? 32 : 6)} width="80" height="56" rx="2" fill="none" stroke="#000" strokeOpacity=".35" />
            <rect x={x + 30} y={y + (open ? 40 : 14)} width="32" height="14" rx="2" fill="#d8c8a8" opacity=".85" /><rect x={x + 34} y={y + (open ? 46 : 20)} width="24" height="1.6" fill="#542b35" /><rect x={x + 38} y={y + (open ? 50 : 24)} width="16" height="1.2" fill="#542b35" opacity=".7" />
            <circle cx={x + 46} cy={y + (open ? 68 : 44) + 8} r="5" fill="url(#silverG)" stroke="#2a1b17" />
          </g>
        )
      }))}
      <rect width="300" height="400" fill="url(#cabGlow)" />
    </svg>
  )
}

export function EnvelopeArt({ className = '' }) {
  return (
    <svg viewBox="0 0 300 400" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="envBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a1219" /><stop offset="1" stopColor="#170c10" /></linearGradient>
        <linearGradient id="envP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e2d4b2" /><stop offset="1" stopColor="#b9a373" /></linearGradient>
        <linearGradient id="envP2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#cdbb94" /><stop offset="1" stopColor="#a08a5e" /></linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#envBg)" />
      <g transform="translate(40 80) rotate(-12 100 80)"><rect width="190" height="130" fill="url(#envP2)" /><g stroke="#5a3a1a" strokeOpacity=".4"><path d="M16 30h150M16 46h120M16 62h140M16 78h100" /></g></g>
      <g transform="translate(70 160) rotate(8 100 80)"><rect width="190" height="130" fill="url(#envP2)" /><g stroke="#5a3a1a" strokeOpacity=".4"><path d="M16 30h150M16 46h130M16 62h90" /></g></g>
      <g transform="translate(46 214) rotate(-4 100 70)">
        <rect width="210" height="140" fill="#000" opacity=".4" transform="translate(5 9)" />
        <rect width="210" height="140" fill="url(#envP)" />
        <path d="M0 0L105 80 210 0" fill="#d0bd92" stroke="#8c7548" strokeOpacity=".6" />
        <path d="M0 140L84 72M210 140L126 72" stroke="#8c7548" strokeOpacity=".5" fill="none" />
        <g transform="translate(105 80)"><WaxSeal size={52} /></g>
      </g>
    </svg>
  )
}

/* ───────── Lost & Found: a glass curiosity dome over one keepsake ───────── */
export function GlassDomeArt({ className = '' }) {
  const id = useId().replace(/:/g, '')
  const u = (n) => `${n}${id}`
  return (
    <svg viewBox="0 0 300 400" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={u('bg')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c1722" /><stop offset=".65" stopColor="#1d0f16" /><stop offset="1" stopColor="#140a0f" /></linearGradient>
        <radialGradient id={u('warm')} cx="30%" cy="26%" r="62%"><stop offset="0" stopColor="#d6a56a" stopOpacity=".3" /><stop offset=".5" stopColor="#8a4a3a" stopOpacity=".12" /><stop offset="1" stopColor="#8a4a3a" stopOpacity="0" /></radialGradient>
        <linearGradient id={u('brass')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5e4727" /><stop offset=".3" stopColor="#b89a5e" /><stop offset=".55" stopColor="#8f7440" /><stop offset="1" stopColor="#4f3b20" /></linearGradient>
        <linearGradient id={u('brassTop')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c7ab70" /><stop offset="1" stopColor="#6f5630" /></linearGradient>
        <radialGradient id={u('velvet')} cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#6a2433" /><stop offset="1" stopColor="#35121c" /></radialGradient>
        <linearGradient id={u('glass')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f1e6cc" stopOpacity=".15" /><stop offset=".5" stopColor="#f1e6cc" stopOpacity=".04" /><stop offset="1" stopColor="#f1e6cc" stopOpacity=".1" /></linearGradient>
        <linearGradient id={u('sheen')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff4dc" stopOpacity="0" /><stop offset=".5" stopColor="#fff4dc" stopOpacity=".38" /><stop offset="1" stopColor="#fff4dc" stopOpacity="0" /></linearGradient>
        <radialGradient id={u('face')} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#f1e8d1" /><stop offset="1" stopColor="#cfc0a0" /></radialGradient>
        <clipPath id={u('clip')}><path d="M58 308C58 156 100 80 150 80S242 156 242 308z" /></clipPath>
        <filter id={u('soft')}><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <rect width="300" height="400" fill={`url(#${u('bg')})`} />
      <rect width="300" height="400" fill={`url(#${u('warm')})`} />
      <ellipse cx="150" cy="338" rx="118" ry="16" fill="#000" opacity=".5" filter={`url(#${u('soft')})`} />

      {/* the keepsake: an old pocket watch on velvet */}
      <ellipse cx="150" cy="298" rx="76" ry="11" fill={`url(#${u('velvet')})`} />
      <path d="M92 296c24-8 40-4 58-4s36-4 58 4" stroke="#a77d83" strokeOpacity=".35" fill="none" />
      <g transform="rotate(-10 150 244)">
        <path d="M146 196C112 190 96 252 126 288" stroke="#b89a5e" strokeWidth="2.2" strokeDasharray="2.4 2.2" fill="none" opacity=".85" />
        <circle cx="150" cy="192" r="7" fill="none" stroke="#b89a5e" strokeWidth="2.4" />
        <rect x="145" y="196" width="10" height="9" rx="2" fill={`url(#${u('brassTop')})`} />
        <circle cx="150" cy="244" r="40" fill={`url(#${u('brassTop')})`} />
        <circle cx="150" cy="244" r="34" fill="#6f5630" />
        <circle cx="150" cy="244" r="31" fill={`url(#${u('face')})`} />
        {Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return <line key={i} x1={150 + Math.sin(a) * 25} y1={244 - Math.cos(a) * 25} x2={150 + Math.sin(a) * 28.5} y2={244 - Math.cos(a) * 28.5} stroke="#542b35" strokeWidth={i % 3 ? 1 : 1.8} /> })}
        <line x1="150" y1="244" x2="150" y2="224" stroke="#3a1d25" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="150" y1="244" x2="164" y2="250" stroke="#542b35" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="150" cy="244" r="2.6" fill="#b89a5e" />
      </g>

      {/* plinth */}
      <path d="M52 306a98 16 0 0 0 196 0v15a98 16 0 0 1-196 0z" fill={`url(#${u('brass')})`} />
      <ellipse cx="150" cy="306" rx="98" ry="16" fill={`url(#${u('brassTop')})`} />
      <ellipse cx="150" cy="305" rx="86" ry="12" fill="#25101a" />
      <path d="M60 322a92 13 0 0 0 180 0" stroke="#000" strokeOpacity=".3" fill="none" />

      {/* glass */}
      <path d="M58 306C58 156 100 80 150 80S242 156 242 306z" fill={`url(#${u('glass')})`} stroke="#f1e6cc" strokeOpacity=".4" strokeWidth="1.4" />
      <path className="dome-hl" d="M72 280C70 196 94 118 132 96" stroke="#fff4dc" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <path className="dome-hl" d="M226 252c2-34-6-76-24-104" stroke="#fff4dc" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <g clipPath={`url(#${u('clip')})`}><rect className="dome-sheen" x="-130" y="60" width="86" height="270" fill={`url(#${u('sheen')})`} /></g>
      <circle cx="150" cy="75" r="5.5" fill={`url(#${u('brassTop')})`} />
      <rect x="147.5" y="78" width="5" height="6" fill="#8f7440" />
    </svg>
  )
}
