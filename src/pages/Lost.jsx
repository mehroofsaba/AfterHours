import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Feather, HelpCircle, Library, Link2, Mail, Pencil, Plus, Star, Tags, Trash2, X } from 'lucide-react'
import { Button, Chip, Confirm, EmptyState, IconButton, Modal, PageHeader, SearchInput } from '../components/ui.jsx'
import { GlassDomeArt } from '../components/Art.jsx'
import MemoryEditor from '../components/MemoryEditor.jsx'
import { AIStatus, SuggestionCard, useAITask } from '../components/AIPanel.jsx'
import { useArchive } from '../lib/store.jsx'
import { useAI } from '../lib/ai.js'
import { cx, firstWords, fmtDate, FRAGMENT_KINDS, hash, todayISO, uid } from '../lib/utils.js'
import { findEchoes } from '../lib/echoes.js'
import { parseLines } from '../lib/prompts.js'
import { useToast } from '../lib/toast.jsx'

const blank = (text) => ({ id: uid(), text, kind: '', themes: [], prompts: [], notes: [], links: [], memoryLinks: [], favorite: false, createdAt: new Date().toISOString() })

function Composer({ onAdd, inputRef }) {
  const [text, setText] = useState('')
  const [focus, setFocus] = useState(false)
  const open = focus || text.length > 0
  const submit = () => { if (text.trim()) { onAdd(text.trim()); setText('') } }
  return (
    <div className="mahogany rounded-xl px-3 py-2 mb-6 flex gap-3 items-end">
      <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={open ? 3 : 1} aria-label="Leave something behind" placeholder="Leave something behind"
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit() }}
        className="flex-1 bg-transparent font-display text-xl leading-snug resize-none outline-none placeholder:text-silver/50 py-2 transition-[height]" />
      {open && <Button variant="primary" size="sm" icon={Plus} onClick={submit} disabled={!text.trim()} className="mb-1.5 shrink-0" onMouseDown={(e) => e.preventDefault()}>Leave it</Button>}
    </div>
  )
}

function FragmentCard({ f, i, onOpen, onFav }) {
  const tilt = ((hash(f.id) % 9) - 4) * 0.28
  const tags = [f.kind, ...f.themes].filter(Boolean)
  return (
    <motion.li initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * .04, duration: .5 }} className="relative mb-5 break-inside-avoid">
      <button onClick={onOpen} style={{ transform: `rotate(${tilt}deg)` }} className="paper block w-full text-left p-5 pb-4 transition-transform duration-300 hover:!rotate-0 hover:-translate-y-1">
        <p className="ink text-[22px] leading-[1.35] clamp-6 whitespace-pre-wrap">{f.text}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-4 pr-8 text-xs text-inkbrown/70">
          <span>{fmtDate(f.createdAt)}</span>
          {tags.slice(0, 3).map((t) => <Chip key={t} tone="paper">{t}</Chip>)}
          {(f.links.length + f.memoryLinks.length) > 0 && <span className="inline-flex items-center gap-1"><Link2 size={12} aria-hidden="true" />{f.links.length + f.memoryLinks.length}</span>}
        </div>
      </button>
      <button aria-label={f.favorite ? 'Remove favourite' : 'Mark favourite'} aria-pressed={!!f.favorite} onClick={onFav}
        className={cx('absolute right-3 bottom-3 p-1.5 rounded-full', f.favorite ? 'text-burgundy' : 'text-inkbrown/50 hover:text-inkbrown')}><Star size={16} strokeWidth={1.5} fill={f.favorite ? 'currentColor' : 'none'} /></button>
    </motion.li>
  )
}

function FragmentView({ id, onClose, onOpen }) {
  const { fragments, memories, upsert, remove, settings } = useArchive()
  const nav = useNavigate()
  const toast = useToast()
  const ai = useAI()
  const f = fragments.find((x) => x.id === id)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [keep, setKeep] = useState(false)
  const [linkPick, setLinkPick] = useState('')
  const task = useAITask()
  const echoes = useMemo(() => (f ? findEchoes(f.text, [...fragments.filter((x) => x.id !== f.id && !f.links.includes(x.id)), ...memories.filter((m) => !f.memoryLinks.includes(m.id))]) : []), [f, fragments, memories])
  if (!f) return null
  const aiOn = settings.aiEnabled && ai.supported
  const set = (patch) => upsert('fragments', { ...f, ...patch })
  const link = (other) => {
    if (fragments.some((x) => x.id === other.id)) {
      set({ links: [...new Set([...f.links, other.id])] })
      upsert('fragments', { ...other, links: [...new Set([...(other.links ?? []), f.id])] })
    } else set({ memoryLinks: [...new Set([...f.memoryLinks, other.id])] })
  }
  const unlink = (other, isFrag) => {
    if (isFrag) { set({ links: f.links.filter((x) => x !== other.id) }); upsert('fragments', { ...other, links: other.links.filter((x) => x !== f.id) }) }
    else set({ memoryLinks: f.memoryLinks.filter((x) => x !== other.id) })
  }
  const linkedFrags = f.links.map((l) => fragments.find((x) => x.id === l)).filter(Boolean)
  const linkedMems = f.memoryLinks.map((l) => memories.find((x) => x.id === l)).filter(Boolean)
  const unlinkedFrags = fragments.filter((x) => x.id !== f.id && !f.links.includes(x.id))
  const run = (t) => task.run(t, f.text)
  const toLetter = () => {
    const l = { id: uid(), to: '', recipient: 'nobody', body: f.text, status: 'draft', favorite: false, versions: [], date: todayISO(), createdAt: new Date().toISOString() }
    upsert('letters', l); remove('fragments', f.id); toast('Moved to the Unsent Archive'); nav(`/unsent?open=${l.id}`)
  }
  const hasConnections = linkedFrags.length || linkedMems.length || echoes.length || unlinkedFrags.length

  return (
    <>
      <Modal open onClose={onClose} label="Fragment" wide>
        <div className="p-5 sm:p-8 max-w-3xl mx-auto">
          <div className="flex justify-between items-start gap-4 mb-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-silver">
              <span className="mr-1">{fmtDate(f.createdAt)}</span>
              {FRAGMENT_KINDS.map((k) => <Chip key={k} tone="silver" active={f.kind === k} onClick={() => set({ kind: f.kind === k ? '' : k })}>{k}</Chip>)}
            </div>
            <IconButton icon={X} label="Close" onClick={onClose} />
          </div>

          {editing ? (
            <div className="grid gap-3">
              <textarea data-autofocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={7} aria-label="Fragment text" className="field font-display text-2xl leading-snug" />
              <div className="flex gap-2"><Button variant="primary" onClick={() => { set({ text: draft.trim() || f.text }); setEditing(false) }}>Save</Button><Button onClick={() => setEditing(false)}>Cancel</Button></div>
            </div>
          ) : <p className="font-display text-3xl sm:text-[36px] leading-snug whitespace-pre-wrap text-parchment">{f.text}</p>}

          {!!f.themes.length && <div className="flex flex-wrap gap-2 mt-5">{f.themes.map((t) => <Chip key={t}>{t}<button aria-label={`Remove ${t}`} onClick={() => set({ themes: f.themes.filter((x) => x !== t) })}><X size={12} /></button></Chip>)}</div>}
          {f.prompts.length > 0 && <ul className="grid gap-2 font-display text-xl italic text-parchment/85 mt-5">{f.prompts.map((p, i) => <li key={i} className="flex gap-2 items-start"><span className="flex-1">{p}</span><IconButton size={28} icon={X} label="Remove prompt" onClick={() => set({ prompts: f.prompts.filter((_, j) => j !== i) })} /></li>)}</ul>}
          {f.notes.length > 0 && <ul className="grid gap-2 mt-5">{f.notes.map((n) => <li key={n.id} className="hairline rounded-lg p-3 flex gap-2 items-start"><span className="flex-1 font-display text-lg">{n.text}</span><IconButton size={28} icon={X} label="Remove note" onClick={() => set({ notes: f.notes.filter((x) => x.id !== n.id) })} /></li>)}</ul>}

          {/* AI appears only when asked for */}
          <div className="flex flex-wrap gap-2 mt-7">
            <Button icon={Tags} disabled={!aiOn || task.phase === 'working'} onClick={() => run('themes')}>Find themes</Button>
            <Button icon={HelpCircle} disabled={!aiOn || task.phase === 'working'} onClick={() => run('prompts')}>Reflective prompts</Button>
            <Button icon={Feather} disabled={!aiOn || task.phase === 'working'} onClick={() => run('rephrase')}>Say it differently</Button>
          </div>
          {!aiOn && <div className="mt-3"><AIStatus compact /></div>}
          {task.phase !== 'idle' && (
            <div className="mt-4">
              <SuggestionCard task={task} onRetry={() => run(task.task)} onDismiss={task.reset}
                useLabel={task.task === 'themes' ? 'Keep themes' : task.task === 'prompts' ? 'Keep prompts' : 'Keep as a note'}
                onUse={(text) => {
                  if (task.task === 'themes') set({ themes: [...new Set([...f.themes, ...parseLines(text, { max: 5, maxLen: 32 })])] })
                  else if (task.task === 'prompts') set({ prompts: [...f.prompts, ...parseLines(text, { max: 3, maxLen: 160 })] })
                  else set({ notes: [...f.notes, { id: uid(), text, createdAt: new Date().toISOString() }] })
                  task.reset(); toast('Kept')
                }}>
                {(text, draft2, setDraft2) => task.task === 'themes'
                  ? <div className="flex flex-wrap gap-2">{parseLines(text, { max: 5, maxLen: 32 }).map((t) => <Chip key={t} className="!text-sm !px-3">{t}</Chip>)}</div>
                  : task.task === 'prompts'
                    ? <ul className="grid gap-2 font-display text-xl italic">{parseLines(text, { max: 3, maxLen: 160 }).map((p) => <li key={p}>{p}</li>)}</ul>
                    : <textarea value={draft2} onChange={(e) => setDraft2(e.target.value)} rows={4} aria-label="Suggestion text" className="field font-display text-lg" />}
              </SuggestionCard>
            </div>
          )}

          {hasConnections ? (
            <section aria-label="Connections" className="mt-8 pt-6 border-t border-silver/15">
              <h3 className="text-xl mb-3">Connections</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {linkedFrags.map((o) => <Chip key={o.id} tone="silver" className="!py-1"><button onClick={() => onOpen(o.id)} className="hover:text-parchment max-w-48 truncate">{firstWords(o.text, 5)}</button><button aria-label="Unlink" onClick={() => unlink(o, true)}><X size={12} /></button></Chip>)}
                {linkedMems.map((o) => <Chip key={o.id} tone="silver" className="!py-1"><Library size={11} aria-hidden="true" /><button onClick={() => nav(`/cabinet?open=${o.id}`)} className="hover:text-parchment max-w-48 truncate">{o.title}</button><button aria-label="Unlink" onClick={() => unlink(o, false)}><X size={12} /></button></Chip>)}
              </div>
              {echoes.length > 0 && (
                <ul className="grid gap-1.5 mb-3">
                  {echoes.map(({ item, shared }) => (
                    <li key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 min-w-0 truncate">{item.title ?? firstWords(item.text, 6)}<span className="text-silver"> · shares {shared.slice(0, 3).join(', ')}</span></span>
                      <Button size="sm" onClick={() => link(item)}>Link</Button>
                    </li>
                  ))}
                </ul>
              )}
              {unlinkedFrags.length > 0 && (
                <div className="flex gap-2 max-w-md"><select className="field !py-1.5 text-sm" aria-label="Link another fragment" value={linkPick} onChange={(e) => setLinkPick(e.target.value)}>
                  <option value="">Link another fragment</option>{unlinkedFrags.map((x) => <option key={x.id} value={x.id}>{firstWords(x.text, 7)}</option>)}</select>
                  <Button size="sm" disabled={!linkPick} onClick={() => { link(fragments.find((x) => x.id === linkPick)); setLinkPick('') }}>Link</Button></div>
              )}
            </section>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-5 border-t border-silver/15">
            <div className="flex flex-wrap gap-2">
              <Button icon={Library} onClick={() => setKeep(true)}>Keep in the Cabinet</Button>
              <Button icon={Mail} onClick={toLetter}>Move to the Unsent Archive</Button>
            </div>
            <div className="flex gap-1">
              <IconButton icon={Pencil} label="Edit" onClick={() => { setDraft(f.text); setEditing(true) }} />
              <IconButton icon={Star} active={f.favorite} label="Favourite" onClick={() => set({ favorite: !f.favorite })} />
              <IconButton icon={Trash2} label="Delete" onClick={() => setConfirm(true)} />
            </div>
          </div>
        </div>
      </Modal>
      <MemoryEditor open={keep} seed={{ body: f.text, title: '', mood: '', tags: f.themes.map((t) => t.toLowerCase()) }} onClose={() => setKeep(false)}
        onSaved={(m) => { remove('fragments', f.id); toast('Moved to the Memory Cabinet'); nav(`/cabinet?open=${m.id}`) }} />
      <Confirm open={confirm} title="Delete this fragment?" onCancel={() => setConfirm(false)} onConfirm={() => { remove('fragments', f.id); setConfirm(false); onClose() }} />
    </>
  )
}

export default function Lost() {
  const { fragments, upsert } = useArchive()
  const [sp, setSp] = useSearchParams()
  const openId = sp.get('open')
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const inputRef = useRef(null)
  const tags = useMemo(() => [...new Set(fragments.flatMap((f) => [f.kind, ...f.themes]).filter(Boolean))], [fragments])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return fragments.filter((f) => !favOnly || f.favorite)
      .filter((f) => !tag || f.kind === tag || f.themes.includes(tag))
      .filter((f) => !s || [f.text, f.kind, f.themes.join(' ')].some((x) => (x ?? '').toLowerCase().includes(s)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [fragments, q, tag, favOnly])
  const open = (id) => { const n = new URLSearchParams(sp); id ? n.set('open', id) : n.delete('open'); setSp(n, { replace: true }) }
  const anyFilter = q || tag || favOnly

  return (
    <>
      <PageHeader title="The Lost & Found">
        {fragments.length > 0 && <SearchInput value={q} onChange={setQ} placeholder="Search fragments" className="w-full sm:w-64" />}
      </PageHeader>
      <Composer onAdd={(text) => upsert('fragments', blank(text))} inputRef={inputRef} />

      {fragments.length > 0 && (tags.length > 0 || fragments.some((f) => f.favorite)) && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <Chip tone="silver" active={favOnly} onClick={() => setFavOnly(!favOnly)} className="!px-3 !py-1 !text-sm shrink-0">Favourites</Chip>
          {tags.map((k) => <Chip key={k} tone="silver" active={tag === k} onClick={() => setTag(tag === k ? '' : k)} className="!px-3 !py-1 !text-sm shrink-0">{k}</Chip>)}
        </div>
      )}

      {!fragments.length ? (
        <EmptyState art={<GlassDomeArt className="w-full h-full" />} title="Nothing here yet" action={<Button variant="primary" icon={Plus} onClick={() => inputRef.current?.focus()}>Leave a fragment</Button>} />
      ) : list.length ? (
        <ul className="columns-1 sm:columns-2 lg:columns-3 gap-5">{list.map((f, i) => <FragmentCard key={f.id} f={f} i={i} onOpen={() => open(f.id)} onFav={() => upsert('fragments', { ...f, favorite: !f.favorite })} />)}</ul>
      ) : (
        <EmptyState title="Nothing matches" action={anyFilter ? <Button onClick={() => { setQ(''); setTag(''); setFavOnly(false) }}>Clear filters</Button> : null} />
      )}

      {openId && <FragmentView id={openId} onClose={() => open(null)} onOpen={open} />}
    </>
  )
}
