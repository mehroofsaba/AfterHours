import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Compass, Home, Lock, Mail, Moon, Settings, Search, Library, Sun } from 'lucide-react'
import { useArchive } from '../lib/store.jsx'
import { IconButton, Modal } from './ui.jsx'
import { cx, fmtDate, firstWords } from '../lib/utils.js'

const ROOMS = [
  { to: '/cabinet', label: 'Memory Cabinet', short: 'Cabinet', icon: Library },
  { to: '/lost', label: 'Lost & Found', short: 'Lost & Found', icon: Compass },
  { to: '/unsent', label: 'Unsent Archive', short: 'Unsent', icon: Mail },
]

export function Wordmark({ className = '', to = '/' }) {
  return <Link to={to} className={cx('wordmark text-[15px] text-parchment hover:text-white transition-colors', className)} aria-label="AFTERHOURS, home">Afterhours</Link>
}

export function AmbientToggle() {
  const { settings, updateSettings } = useArchive()
  return <IconButton icon={settings.ambient ? Moon : Sun} label={settings.ambient ? 'Still the room' : 'Wake the room'} onClick={() => updateSettings({ ambient: !settings.ambient })} />
}

/* Top navigation used on the landing page and the central archive */
export function TopNav({ transparent = false }) {
  const link = ({ isActive }) => cx('text-[13px] px-1 py-1 transition-colors relative', isActive ? 'text-parchment' : 'text-silver hover:text-parchment')
  return (
    <header className={cx('absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 sm:px-10 py-5 safe-t', transparent && 'bg-gradient-to-b from-ink/70 to-transparent')}>
      <Wordmark />
      <nav className="hidden md:flex items-center gap-8" aria-label="Main">
        <NavLink to="/" end className={link}>Home</NavLink>
        {ROOMS.map((r) => <NavLink key={r.to} to={r.to} className={link}>{r.label}</NavLink>)}
      </nav>
      <div className="flex items-center gap-1"><AmbientToggle /><IconButton icon={Settings} label="Settings" onClick={() => (window.location.hash = '#/settings')} /></div>
    </header>
  )
}

/* Global search across every room */
function GlobalSearch({ open, onClose }) {
  const { memories, fragments, letters } = useArchive()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  useEffect(() => { if (open) setQ('') }, [open])
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    const has = (...v) => v.some((x) => (x ?? '').toLowerCase().includes(s))
    return [
      ...memories.filter((m) => has(m.title, m.body, (m.tags ?? []).join(' '))).map((m) => ({ room: 'Memory Cabinet', icon: Library, title: m.title, meta: fmtDate(m.date), to: `/cabinet?open=${m.id}` })),
      ...fragments.filter((f) => has(f.text, (f.themes ?? []).join(' '))).map((f) => ({ room: 'Lost & Found', icon: Compass, title: firstWords(f.text, 7), meta: fmtDate(f.createdAt), to: `/lost?open=${f.id}` })),
      ...letters.filter((l) => has(l.to, l.body)).map((l) => ({ room: 'Unsent Archive', icon: Mail, title: l.to || 'Untitled letter', meta: fmtDate(l.date), to: `/unsent?open=${l.id}` })),
    ].slice(0, 30)
  }, [q, memories, fragments, letters])
  return (
    <Modal open={open} onClose={onClose} label="Search the archive">
      <div className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver" aria-hidden="true" />
          <input data-autofocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything" aria-label="Search everything" className="field !pl-10 !py-3 text-base" />
        </div>
        <ul className="mt-3 max-h-[50vh] overflow-y-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button onClick={() => { onClose(); nav(r.to) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/[0.06]">
                <r.icon size={16} strokeWidth={1.5} className="text-rose shrink-0" aria-hidden="true" />
                <span className="flex-1 min-w-0 truncate">{r.title}</span>
                <span className="text-xs text-silver shrink-0">{r.room} · {r.meta}</span>
              </button>
            </li>
          ))}
          {q.trim() && !results.length && <li className="px-3 py-6 text-center text-silver">Nothing found</li>}
        </ul>
      </div>
    </Modal>
  )
}

const VARIANTS = {
  cabinet: { initial: { opacity: 0, y: 48, clipPath: 'inset(22% 0 0 0)' }, animate: { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' }, exit: { opacity: 0, y: 12 } },
  lost: { initial: { opacity: 0, filter: 'blur(12px)', scale: 1.025 }, animate: { opacity: 1, filter: 'blur(0px)', scale: 1 }, exit: { opacity: 0 } },
  unsent: { initial: { opacity: 0, rotateX: -10, y: -24, transformOrigin: '50% 0%' }, animate: { opacity: 1, rotateX: 0, y: 0 }, exit: { opacity: 0, y: 8 } },
  plain: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
}
export const roomOf = (path) => (path.startsWith('/cabinet') ? 'cabinet' : path.startsWith('/lost') ? 'lost' : path.startsWith('/unsent') ? 'unsent' : 'plain')

export function Shell() {
  const { drawers, persistent } = useArchive()
  const loc = useLocation()
  const [sp] = useSearchParams()
  const [searchOpen, setSearchOpen] = useState(false)
  const activeDrawer = sp.get('drawer'), favOnly = sp.get('fav') === '1'
  const onCabinet = loc.pathname.startsWith('/cabinet')
  const v = VARIANTS[roomOf(loc.pathname)]

  useEffect(() => {
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) } }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [])

  const item = (active) => cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', active ? 'bg-burgundy text-parchment border border-rose/30' : 'text-silver hover:text-parchment hover:bg-white/[0.05] border border-transparent')

  const sub = (active) => cx('flex items-center rounded-md px-3 py-1.5 text-[13px] transition-colors', active ? 'bg-burgundy/70 text-parchment' : 'text-silver hover:text-parchment hover:bg-white/[0.05]')

  return (
    <div className="min-h-dvh flex relative">
      {/* desktop sidebar */}
      <aside className="hidden md:flex w-[248px] shrink-0 sticky top-0 h-dvh flex-col border-r border-silver/15 bg-gradient-to-b from-mahogany/70 to-ink/90 px-4 py-6">
        <Wordmark className="px-3 mb-8" to="/archive" />
        <nav className="flex flex-col gap-1" aria-label="Rooms">
          <NavLink to="/archive" className={({ isActive }) => item(isActive)}><Home size={16} strokeWidth={1.5} aria-hidden="true" />The Archive</NavLink>
          {ROOMS.map((r) => (
            <div key={r.to}>
              <NavLink to={r.to} className={({ isActive }) => (r.to === '/cabinet' && isActive ? cx(item(false), 'bg-white/[0.06] !text-parchment') : item(isActive))}><r.icon size={16} strokeWidth={1.5} aria-hidden="true" />{r.label}</NavLink>
              <AnimatePresence initial={false}>
                {r.to === '/cabinet' && onCabinet && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="ml-[22px] pl-3 border-l border-silver/15 my-1 flex flex-col gap-0.5">
                      <Link to="/cabinet" className={sub(!activeDrawer && !favOnly)}>All memories</Link>
                      <Link to="/cabinet?fav=1" className={sub(favOnly)}>Favourites</Link>
                      {drawers.map((d) => <Link key={d.id} to={`/cabinet?drawer=${d.id}`} className={sub(activeDrawer === d.id)}><span className="truncate">{d.name}</span></Link>)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <button onClick={() => setSearchOpen(true)} className={cx(item(false), 'w-full text-left')}><Search size={16} strokeWidth={1.5} aria-hidden="true" />Search<kbd className="ml-auto text-[11px] text-silver/60 font-sans">Ctrl K</kbd></button>
          <NavLink to="/settings" className={({ isActive }) => item(isActive)}><Settings size={16} strokeWidth={1.5} aria-hidden="true" />Settings</NavLink>
          <p className="flex items-center gap-2 px-3 pt-4 text-xs text-silver/70"><Lock size={12} aria-hidden="true" />Stored on this device</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 safe-t bg-ink/90 backdrop-blur border-b border-silver/10">
          <Wordmark to="/archive" />
          <div className="flex items-center"><IconButton icon={Search} label="Search" onClick={() => setSearchOpen(true)} /><AmbientToggle /></div>
        </header>
        <div className="hidden md:flex justify-end px-8 pt-4 -mb-2"><AmbientToggle /></div>
        {!persistent && <div role="alert" className="mx-4 sm:mx-8 mt-4 rounded-lg border border-[#a8545f]/50 bg-burgundy-deep/60 px-4 py-2.5 text-sm">This browser is blocking storage, so entries will vanish when you close the tab. Export from Settings before leaving.</div>}

        <div style={{ perspective: 1400 }} className="flex-1">
          <AnimatePresence mode="wait" initial>
            <motion.main key={loc.pathname} {...v} transition={{ duration: .5, ease: [.22, .8, .2, 1] }} className="px-4 sm:px-8 py-5 sm:py-6 pb-28 md:pb-12 max-w-6xl w-full mx-auto">
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      {/* mobile tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around bg-mahogany/95 backdrop-blur border-t border-silver/20 safe-b" aria-label="Rooms">
        {[{ to: '/archive', label: 'Archive', icon: Home }, ...ROOMS.map((r) => ({ to: r.to, label: r.short, icon: r.icon })), { to: '/settings', label: 'Settings', icon: Settings }].map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2.5 px-2 text-[11px] min-w-14', isActive ? 'text-parchment' : 'text-silver')}>
            {({ isActive }) => <><t.icon size={19} strokeWidth={1.5} className={isActive ? 'text-rose' : ''} aria-hidden="true" />{t.label}</>}
          </NavLink>
        ))}
      </nav>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
          </div>
  )
}
