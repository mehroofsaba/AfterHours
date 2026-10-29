import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button, Chip, Label, Modal, ModalHeader } from './ui.jsx'
import { MOODS, firstWords, todayISO, uid } from '../lib/utils.js'
import { useArchive } from '../lib/store.jsx'

export default function MemoryEditor({ open, memory, seed, onClose, onSaved }) {
  const { drawers, upsert } = useArchive()
  const [f, setF] = useState(null)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!open) return
    setF(memory ? { ...memory } : { id: uid(), title: '', body: seed?.body ?? '', date: todayISO(), mood: '', tags: [], drawer: drawers[0]?.id ?? null, favorite: false, archived: false, keepsakes: [], createdAt: new Date().toISOString(), ...seed })
    setTagInput('')
  }, [open, memory, seed]) // eslint-disable-line

  if (!f) return null
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const addTags = (raw) => {
    const t = raw.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
    if (t.length) set('tags', [...new Set([...f.tags, ...t])])
    setTagInput('')
  }
  const canSave = f.body.trim() || f.title.trim()
  const save = () => {
    const tags = tagInput.trim() ? [...new Set([...f.tags, ...tagInput.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)])] : f.tags
    const saved = upsert('memories', { ...f, tags, title: f.title.trim() || firstWords(f.body, 5) })
    onSaved?.(saved); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} label={memory ? 'Edit memory' : 'New memory'}>
      <ModalHeader title={memory ? 'Edit memory' : 'New memory'} onClose={onClose} />
      <div className="px-6 pb-6 grid gap-4">
        <div><Label htmlFor="m-title">Title</Label><input id="m-title" data-autofocus className="field" value={f.title} onChange={(e) => set('title', e.target.value)} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label htmlFor="m-date">Date</Label><input id="m-date" type="date" className="field" value={f.date} onChange={(e) => set('date', e.target.value)} /></div>
          <div><Label htmlFor="m-drawer">Drawer</Label>
            <select id="m-drawer" className="field" value={f.drawer ?? ''} onChange={(e) => set('drawer', e.target.value || null)}>
              <option value="">No drawer</option>{drawers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
        </div>
        <div><Label htmlFor="m-body">Memory</Label><textarea id="m-body" className="field font-display text-lg leading-relaxed min-h-44 resize-y" value={f.body} onChange={(e) => set('body', e.target.value)} /></div>
        <div>
          <Label>Mood</Label>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => <Chip key={m} tone="silver" active={f.mood === m} onClick={() => set('mood', f.mood === m ? '' : m)}>{m}</Chip>)}
          </div>
        </div>
        <div>
          <Label htmlFor="m-tags">Tags</Label>
          <div className="field flex flex-wrap items-center gap-1.5 !py-2">
            {f.tags.map((t) => (
              <Chip key={t} tone="silver">{t}<button aria-label={`Remove ${t}`} onClick={() => set('tags', f.tags.filter((x) => x !== t))} className="hover:text-parchment"><X size={12} /></button></Chip>
            ))}
            <input id="m-tags" value={tagInput} onChange={(e) => (e.target.value.includes(',') ? addTags(e.target.value) : setTagInput(e.target.value))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTags(tagInput) } else if (e.key === 'Backspace' && !tagInput && f.tags.length) set('tags', f.tags.slice(0, -1)) }}
              className="flex-1 min-w-24 bg-transparent outline-none text-sm py-0.5" placeholder={f.tags.length ? '' : 'rain, home'} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!canSave}>Save memory</Button>
        </div>
      </div>
    </Modal>
  )
}
