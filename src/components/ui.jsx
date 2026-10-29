import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2, Search, X } from 'lucide-react'
import { cx } from '../lib/utils.js'

export function Button({ variant = 'ghost', size = 'md', loading, icon: Icon, children, className = '', ...p }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background,border-color,box-shadow,transform,opacity] duration-200 disabled:opacity-45 disabled:cursor-not-allowed active:translate-y-px select-none'
  const sizes = { sm: 'px-3 py-1.5 text-[13px]', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-[15px]' }
  const variants = {
    primary: 'bg-burgundy text-parchment border border-rose/40 hover:bg-burgundy-2 hover:border-rose/70 shadow-[0_6px_18px_-8px_rgba(84,43,53,.9)]',
    ghost: 'border border-silver/30 text-parchment hover:border-rose/70 hover:bg-white/[0.04]',
    quiet: 'text-silver hover:text-parchment hover:bg-white/[0.05]',
    danger: 'border border-silver/30 text-parchment hover:border-[#a8545f] hover:text-[#e6b9be]',
    paper: 'bg-burgundy-deep/90 text-[#ecdcc0] border border-[#2b1d16]/40 hover:bg-burgundy',
    paperGhost: 'border border-inkbrown/35 text-inkbrown hover:bg-inkbrown/10',
  }
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} disabled={p.disabled || loading} {...p}>
      {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : Icon ? <Icon size={15} strokeWidth={1.6} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, label, active, size = 36, className = '', paper = false, ...p }) {
  return (
    <button aria-label={label} title={label} style={{ width: size, height: size }}
      className={cx('inline-flex items-center justify-center rounded-full transition-colors duration-200 shrink-0',
        paper ? 'text-inkbrown/80 hover:bg-inkbrown/10 hover:text-inkbrown' : 'text-silver hover:text-parchment hover:bg-white/[0.06]',
        active && (paper ? 'text-burgundy' : 'text-rose'), className)} {...p}>
      <Icon size={Math.round(size * 0.46)} strokeWidth={1.5} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}

export function Chip({ children, tone = 'burgundy', className = '', onClick, active, ...p }) {
  const tones = {
    burgundy: 'bg-burgundy/80 text-[#e9d9bf] border-rose/30',
    silver: 'bg-white/[0.04] text-silver border-silver/25',
    paper: 'bg-burgundy-deep/15 text-inkbrown border-inkbrown/30',
  }
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag onClick={onClick} aria-pressed={onClick ? !!active : undefined}
      className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs leading-5 transition-colors',
        active ? 'bg-burgundy text-parchment border-rose/70' : tones[tone],
        onClick && 'hover:border-rose/70 cursor-pointer', className)} {...p}>
      {children}
    </Tag>
  )
}

export function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <label className={cx('relative flex items-center', className)}>
      <Search size={15} strokeWidth={1.5} className="absolute left-3 text-silver pointer-events-none" aria-hidden="true" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="field !rounded-full !pl-9 !py-2 text-sm min-w-0 w-full" />
    </label>
  )
}

export const Label = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={cx('block text-[13px] text-silver mb-1.5', className)}>{children}</label>
)

/* Modal with Escape, scroll lock, focus return */
export function Modal({ open, onClose, children, label, wide = false, paperless = false, className = '' }) {
  const ref = useRef(null)
  const lastFocus = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current() }
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null)
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => ref.current?.querySelector('[data-autofocus]')?.focus(), 60)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; clearTimeout(t); lastFocus.current?.focus?.() }
  }, [open])
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
          <div className="absolute inset-0 bg-[#0b0707]/80 backdrop-blur-[3px]" onClick={onClose} />
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={label}
            initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: .98 }}
            transition={{ duration: .32, ease: [.22, .8, .2, 1] }}
            className={cx('relative w-full max-h-[94dvh] sm:max-h-[90dvh] overflow-y-auto', wide ? 'max-w-6xl' : 'max-w-xl',
              !paperless && 'mahogany rounded-t-2xl sm:rounded-2xl', className)}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-3">
      <h2 className="text-2xl">{title}</h2>
      <IconButton icon={X} label="Close" onClick={onClose} />
    </div>
  )
}

export function Confirm({ open, title, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} label={title}>
      <div className="p-6">
        <h2 className="text-2xl mb-6">{title}</h2>
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} data-autofocus>Keep it</Button>
          <Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}

/* tiny popover menu */
export function Menu({ trigger, items, align = 'left', paper = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const k = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', h); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('pointerdown', h); document.removeEventListener('keydown', k) }
  }, [open])
  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.ul role="menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .15 }}
            className={cx('absolute z-30 mt-2 min-w-48 rounded-xl p-1.5 mahogany', align === 'right' ? 'right-0' : 'left-0', 'bottom-full mb-2 mt-0 sm:bottom-auto sm:mb-0 sm:mt-2')}>
            {items.map((it) => (
              <li key={it.label} role="none">
                <button role="menuitem" onClick={() => { setOpen(false); it.onClick() }} disabled={it.disabled}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left text-parchment hover:bg-white/[0.06] disabled:opacity-40">
                  {it.icon && <it.icon size={15} strokeWidth={1.5} className="text-silver" aria-hidden="true" />}{it.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export function EmptyState({ art, title, action }) {
  return (
    <div className="mx-auto max-w-xs flex flex-col items-center text-center gap-4 py-10 sm:py-14">
      {art && <div className="w-24 h-32 rounded-lg overflow-hidden hairline shadow-[0_14px_30px_-14px_rgba(0,0,0,.9)]">{art}</div>}
      <h3 className="text-2xl text-parchment/90">{title}</h3>
      {action}
    </div>
  )
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full hairline p-0.5">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} aria-pressed={value === o.id} aria-label={o.label} title={o.label}
          className={cx('inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-[13px] transition-colors', value === o.id ? 'bg-burgundy text-parchment' : 'text-silver hover:text-parchment')}>
          {o.icon && <o.icon size={15} strokeWidth={1.5} aria-hidden="true" />}{o.text}
        </button>
      ))}
    </div>
  )
}

export function Fab({ label, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className="md:hidden fixed right-4 bottom-[4.75rem] z-40 size-14 rounded-full bg-burgundy border border-rose/50 text-parchment grid place-items-center shadow-[0_14px_28px_-8px_rgba(0,0,0,.9)] active:scale-95 transition-transform">
      <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
    </button>
  )
}

export function PageHeader({ title, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  )
}
