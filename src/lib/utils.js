export const uid = () =>
  (crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`)

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function hash(str = '') {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

export function seeded(seed) {
  let s = seed || 1
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
}

export const firstWords = (text = '', n = 5) => {
  const w = text.trim().split(/\s+/).slice(0, n).join(' ')
  return w + (text.trim().split(/\s+/).length > n ? '…' : '')
}

export const MOODS = ['Peace', 'Nostalgia', 'Love', 'Joy', 'Wonder', 'Longing', 'Grief', 'Growth', 'Gratitude', 'Unease']
export const FRAGMENT_KINDS = ['Thought', 'Dream', 'Question', 'Feeling', 'Observation']
export const RECIPIENTS = [
  { id: 'someone', label: 'Someone' },
  { id: 'past-self', label: 'Past self' },
  { id: 'nobody', label: 'Nobody' },
]

export const cx = (...a) => a.filter(Boolean).join(' ')

export function downloadBlob(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
