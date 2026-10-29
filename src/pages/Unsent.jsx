import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, ChevronDown, Feather, Mail, Pencil, Plus, RefreshCw, ScrollText, Square, Star, Trash2, PenLine, X } from 'lucide-react'
import { Button, Chip, Confirm, EmptyState, Fab, IconButton, Menu, Modal, PageHeader, Segmented, SearchInput } from '../components/ui.jsx'
import { EnvelopeArt, WaxSeal } from '../components/Art.jsx'
import { AIStatus, useAITask } from '../components/AIPanel.jsx'
import { useArchive } from '../lib/store.jsx'
import { cancelGeneration, useAI } from '../lib/ai.js'
import { getModel } from '../lib/models.js'
import { cx, fmtDate, RECIPIENTS, todayISO, uid } from '../lib/utils.js'
import { TASKS } from '../lib/prompts.js'
import { useToast } from '../lib/toast.jsx'

const newLetter = () => ({ id: uid(), to: '', recipient: 'someone', body: '', status: 'draft', favorite: false, versions: [], date: todayISO(), createdAt: new Date().toISOString() })
const titleOf = (l) => l.to?.trim() || 'Untitled letter'

function LetterCard({ l, i, onOpen }) {
  const kept = l.status === 'kept'
  return (
    <motion.li initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * .04, duration: .5 }}>
      <button onClick={onOpen} className="paper group block w-full min-h-52 text-left p-5 pb-4 transition-transform duration-300 hover:-translate-y-1 hover:-rotate-[.4deg] flex flex-col">
        <h3 className="ink text-[28px] leading-tight pr-12">{titleOf(l)}</h3>
        <p className="ink text-[19px] leading-snug mt-2 clamp-3 text-inkbrown/80 whitespace-pre-wrap">{l.body}</p>
        <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-inkbrown/70">
          <span>{fmtDate(l.date)}</span><Chip tone="paper">{kept ? 'Sealed' : 'Draft'}</Chip>
          {l.favorite && <Star size={13} className="text-burgundy" fill="currentColor" aria-label="Favourite" />}
        </div>
        {kept && <WaxSeal size={42} className="absolute top-3 right-3 -rotate-6 drop-shadow-[0_3px_3px_rgba(0,0,0,.4)]" />}
      </button>
    </motion.li>
  )
}

function NeedsModelPaper({ onConfirm, onCancel }) {
  const ai = useAI()
  const m = getModel(ai.modelId)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px]">Local AI needs a one-time download of {m.name} ({m.size}). It stays on this device.</p>
      <div className="flex gap-2"><Button variant="paper" size="sm" onClick={onConfirm}>Download and continue</Button><Button variant="paperGhost" size="sm" onClick={onCancel}>Not now</Button></div>
    </div>
  )
}

function Compare({ letter, task, onKeep, onReplace, onRetry, onClose }) {
  const [draft, setDraft] = useState('')
  useEffect(() => { if (task.phase === 'done') setDraft(task.text) }, [task.phase, task.text])
  const working = task.phase === 'working'
  return (
    <Modal open={task.phase !== 'idle'} onClose={() => { cancelGeneration(); onClose() }} label="Compare versions" wide paperless>
      <div className="mahogany rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl">{task.task && TASKS[task.task].label}</h2>
          <IconButton icon={X} label="Close" onClick={() => { cancelGeneration(); onClose() }} />
        </div>
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <section className="paper p-5 sm:p-7 flex flex-col" aria-label="Your words">
            <h3 className="text-xl text-inkbrown/80 mb-3">Your words</h3>
            <p className="ink text-xl sm:text-[22px] leading-relaxed whitespace-pre-wrap flex-1 max-h-[50vh] overflow-y-auto">{letter.body}</p>
          </section>
          <section className="paper p-5 sm:p-7 flex flex-col" aria-label="Suggestion" aria-live="polite">
            <h3 className="text-xl text-inkbrown/80 mb-3">Suggestion</h3>
            {task.phase === 'error' ? (
              <p className="text-[#7a2a38] text-sm">{task.error}</p>
            ) : task.phase === 'needs-model' ? (
              <div className="paper-ui text-inkbrown"><NeedsModelPaper onConfirm={task.confirm} onCancel={onClose} /></div>
            ) : working && !task.text ? (
              <div className="flex-1"><AIStatus compact /><p className="text-sm text-inkbrown/70 mt-1" role="status">Thinking on this device…</p></div>
            ) : (
              <textarea value={working ? task.text : draft} onChange={(e) => setDraft(e.target.value)} readOnly={working} aria-label="Suggested text"
                className="ink flex-1 min-h-56 max-h-[50vh] bg-transparent outline-none resize-none text-xl sm:text-[22px] leading-relaxed" />
            )}
          </section>
        </div>
        <div className="flex flex-wrap gap-2 mt-5 justify-end">
          {working ? <Button icon={Square} onClick={cancelGeneration}>Stop</Button> : task.phase === 'needs-model' ? null : <>
            <Button variant="quiet" onClick={onClose}>Discard</Button>
            <Button icon={RefreshCw} onClick={onRetry}>Try again</Button>
            {task.phase === 'done' && <>
              <Button onClick={() => onReplace(draft)}>Replace my words</Button>
              <Button variant="primary" icon={Check} onClick={() => onKeep(draft)}>Keep both</Button>
            </>}
          </>}
        </div>
      </div>
    </Modal>
  )
}

function LetterPane({ id, onBack, onGone }) {
  const { letters, upsert, remove, settings } = useArchive()
  const stored = letters.find((l) => l.id === id)
  const ai = useAI()
  const toast = useToast()
  const task = useAITask()
  const [form, setForm] = useState(stored)
  const [editing, setEditing] = useState(stored?.status !== 'kept')
  const [tab, setTab] = useState('original')
  const [confirm, setConfirm] = useState(null)
  const [saved, setSaved] = useState(true)
  const lastId = useRef(id)

  useEffect(() => { if (lastId.current !== id) { lastId.current = id; setForm(stored); setEditing(stored?.status !== 'kept'); setTab('original'); task.reset(); setSaved(true) } }, [id]) // eslint-disable-line
  // autosave drafts quietly, never overwriting more than what the person typed
  useEffect(() => {
    if (!form || !stored || form.id !== stored.id) return
    if (form.to === stored.to && form.body === stored.body && form.recipient === stored.recipient) return
    setSaved(false)
    const t = setTimeout(() => { upsert('letters', { ...stored, to: form.to, body: form.body, recipient: form.recipient }); setSaved(true) }, 500)
    return () => clearTimeout(t)
  }, [form?.to, form?.body, form?.recipient]) // eslint-disable-line

  if (!stored || !form) return null
  const versions = stored.versions ?? []
  const shown = tab === 'original' ? null : versions.find((v) => v.id === tab)
  const aiOn = settings.aiEnabled && ai.supported
  const flush = () => upsert('letters', { ...stored, to: form.to, body: form.body, recipient: form.recipient })
  const run = (kind) => task.run(kind, `${form.to ? `To: ${form.to}\n\n` : ''}${form.body}`)
  const keepVersion = (text) => { const v = { id: uid(), kind: task.task, label: TASKS[task.task].label, text, createdAt: new Date().toISOString() }; upsert('letters', { ...stored, to: form.to, body: form.body, versions: [...versions, v] }); setTab(v.id); task.reset(); toast('Version kept beside your original') }
  const replace = (text) => { upsert('letters', { ...stored, to: form.to, versions: [...versions, { id: uid(), kind: 'original', label: 'Earlier original', text: form.body, createdAt: new Date().toISOString() }], body: text }); setForm({ ...form, body: text }); task.reset(); toast('Original replaced. The earlier words are kept as a version.') }
  const seal = () => { flush(); upsert('letters', { ...stored, to: form.to, body: form.body, status: 'kept' }); setEditing(false); toast('Sealed and kept') }
  const canWrite = editing && !shown

  return (
    <motion.div key={id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: [.22, .8, .2, 1] }} className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="quiet" size="sm" icon={ArrowLeft} onClick={onBack}>Letters</Button>
        <div className="flex items-center gap-1">
          {editing && <span className="text-xs text-silver mr-2" role="status">{saved ? 'Draft saved' : 'Saving…'}</span>}
          <IconButton icon={Star} active={stored.favorite} label={stored.favorite ? 'Remove favourite' : 'Mark favourite'} onClick={() => upsert('letters', { ...stored, favorite: !stored.favorite })} />
          <IconButton icon={Trash2} label="Delete letter" onClick={() => setConfirm('delete')} />
        </div>
      </div>

      <article className="paper px-6 sm:px-14 pt-8 sm:pt-12 pb-6 min-h-[34rem] flex flex-col">
        {versions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="Versions">
            {[{ id: 'original', label: 'Original' }, ...versions].map((v) => (
              <button key={v.id} role="tab" aria-selected={tab === v.id} onClick={() => setTab(v.id)} className={cx('rounded-full px-3 py-1 text-xs border transition-colors', tab === v.id ? 'bg-burgundy-deep text-[#ecdcc0] border-burgundy-deep' : 'border-inkbrown/35 text-inkbrown hover:bg-inkbrown/10')}>{v.label}</button>
            ))}
          </div>
        )}
        {canWrite ? (
          <input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} aria-label="Who is this to?" placeholder="To…" data-autofocus={!stored.body}
            className="ink bg-transparent outline-none text-4xl sm:text-5xl leading-tight mb-2 w-full" />
        ) : <h2 className="ink text-4xl sm:text-5xl leading-tight mb-2">{titleOf(stored)}</h2>}
        <div className="flex items-center gap-3 mb-5 text-sm text-inkbrown/70">
          <span>{fmtDate(stored.date)}</span>
          {canWrite ? (
            <Menu paper trigger={({ toggle }) => <button onClick={toggle} className="inline-flex items-center gap-1 rounded-full border border-inkbrown/30 px-2.5 py-0.5 text-xs hover:bg-inkbrown/10" aria-label="Who is it for">{RECIPIENTS.find((r) => r.id === form.recipient)?.label}<ChevronDown size={12} aria-hidden="true" /></button>}
              items={RECIPIENTS.map((r) => ({ label: r.label, onClick: () => setForm({ ...form, recipient: r.id }) }))} />
          ) : <Chip tone="paper">{RECIPIENTS.find((r) => r.id === stored.recipient)?.label}</Chip>}
        </div>
        {canWrite ? (
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} aria-label="Letter" placeholder="Write what you never said"
            className="ink paper-lines flex-1 min-h-[22rem] w-full bg-transparent outline-none resize-none text-[23px] sm:text-[27px]" style={{ lineHeight: '34px' }} />
        ) : (
          <div className="ink paper-lines flex-1 min-h-[22rem] whitespace-pre-wrap text-[23px] sm:text-[27px]" style={{ lineHeight: '34px' }}>{shown ? shown.text : stored.body}</div>
        )}

        <div className="relative flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-inkbrown/20 min-h-16">
          {shown ? (
            <>
              <Button size="sm" variant="paperGhost" onClick={() => setConfirm('replace')}>Replace original</Button>
              <Button size="sm" variant="paperGhost" onClick={() => { upsert('letters', { ...stored, versions: versions.filter((v) => v.id !== shown.id) }); setTab('original') }}>Delete version</Button>
            </>
          ) : editing ? (
            <>
              <Menu paper trigger={({ toggle }) => <Button variant="paperGhost" icon={PenLine} disabled={!aiOn || !form.body.trim() || task.phase === 'working'} onClick={toggle}>Rewrite</Button>}
                items={[{ label: 'As a poem', icon: Feather, onClick: () => run('poem') }, { label: 'As a letter', icon: Mail, onClick: () => run('letter') }, { label: 'More reflective', icon: ScrollText, onClick: () => run('reflective') }]} />
              <Button variant="paper" icon={Check} onClick={seal} disabled={!form.body.trim()}>Seal letter</Button>
            </>
          ) : (
            <Button variant="paperGhost" icon={Pencil} onClick={() => setEditing(true)}>Revise</Button>
          )}
          <AnimatePresence>
            {stored.status === 'kept' && !editing && (
              <motion.div key="seal" initial={{ scale: 1.9, rotate: -25, opacity: 0 }} animate={{ scale: 1, rotate: -8, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="absolute -bottom-5 right-0 sm:right-2 drop-shadow-[0_8px_8px_rgba(0,0,0,.45)]" title="Kept here, never sent">
                <WaxSeal size={84} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </article>
      {(!aiOn) && <div className="mt-4"><AIStatus compact /></div>}

      <Compare letter={form} task={task} onKeep={keepVersion} onReplace={replace} onRetry={() => run(task.task)} onClose={task.reset} />
      <Confirm open={confirm === 'delete'} title="Discard this letter?" confirmLabel="Discard" onCancel={() => setConfirm(null)} onConfirm={() => { remove('letters', stored.id); setConfirm(null); onGone() }} />
      <Confirm open={confirm === 'replace'} title="Replace your original words?" confirmLabel="Replace" onCancel={() => setConfirm(null)}
        onConfirm={() => { upsert('letters', { ...stored, versions: [...versions.filter((v) => v.id !== shown.id), { id: uid(), kind: 'original', label: 'Earlier original', text: stored.body, createdAt: new Date().toISOString() }], body: shown.text }); setForm({ ...form, body: shown.text }); setConfirm(null); setTab('original') }} />
    </motion.div>
  )
}

const FILTERS = [{ id: 'all', text: 'All', label: 'All letters' }, { id: 'draft', text: 'Drafts', label: 'Drafts' }, { id: 'kept', text: 'Sealed', label: 'Sealed' }, { id: 'fav', text: 'Favourites', label: 'Favourites' }]

export default function Unsent() {
  const { letters, upsert } = useArchive()
  const [sp, setSp] = useSearchParams()
  const openId = sp.get('open')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return letters
      .filter((l) => filter === 'all' || (filter === 'fav' ? l.favorite : l.status === filter))
      .filter((l) => !s || `${l.to} ${l.body}`.toLowerCase().includes(s))
      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
  }, [letters, q, filter])
  const open = (id) => { const n = new URLSearchParams(sp); id ? n.set('open', id) : n.delete('open'); setSp(n, { replace: true }) }
  const create = () => { const l = upsert('letters', newLetter()); open(l.id) }
  const current = letters.find((l) => l.id === openId)

  // focused writing view: nothing else on the page
  if (current) return <LetterPane id={current.id} onBack={() => open(null)} onGone={() => open(null)} />

  return (
    <>
      <PageHeader title="The Unsent Archive">
        <Button variant="primary" icon={Plus} onClick={create} className="max-md:hidden">New letter</Button>
      </PageHeader>
      {letters.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput value={q} onChange={setQ} placeholder="Search letters" className="flex-1 min-w-48 sm:max-w-sm" />
          <div className="overflow-x-auto -mx-1 px-1"><Segmented label="Filter letters" value={filter} onChange={setFilter} options={FILTERS} /></div>
        </div>
      )}
      {!letters.length ? (
        <EmptyState art={<EnvelopeArt className="w-full h-full" />} title="No letters yet" action={<Button variant="primary" icon={Plus} onClick={create}>Write a letter</Button>} />
      ) : list.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((l, i) => <LetterCard key={l.id} l={l} i={i} onOpen={() => open(l.id)} />)}</ul>
      ) : (
        <EmptyState title="Nothing matches" action={<Button onClick={() => { setQ(''); setFilter('all') }}>Clear filters</Button>} />
      )}
      <Fab label="New letter" icon={Plus} onClick={create} />
    </>
  )
}
