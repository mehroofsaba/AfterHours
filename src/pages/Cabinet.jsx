import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Archive as ArchiveIcon, ArchiveRestore, FolderPlus, LayoutGrid, List, Pencil, Plus, SlidersHorizontal, Star, Trash2, X, Feather, ScrollText, Gem, PenLine } from 'lucide-react'
import { Button, Chip, Confirm, EmptyState, Fab, IconButton, Label, Menu, Modal, ModalHeader, PageHeader, Segmented, SearchInput } from '../components/ui.jsx'
import { CabinetArt } from '../components/Art.jsx'
import MemoryEditor from '../components/MemoryEditor.jsx'
import { AIStatus, SuggestionCard, useAITask } from '../components/AIPanel.jsx'
import { useArchive } from '../lib/store.jsx'
import { useAI } from '../lib/ai.js'
import { cx, fmtDate, MOODS, uid } from '../lib/utils.js'
import { TASKS } from '../lib/prompts.js'
import { useToast } from '../lib/toast.jsx'

const FavStar = ({ on, onClick, className = '' }) => (
  <button aria-label={on ? 'Remove favourite' : 'Mark favourite'} aria-pressed={on} onClick={onClick}
    className={cx('p-1.5 rounded-full transition-colors', on ? 'text-rose' : 'text-silver/60 hover:text-parchment', className)}>
    <Star size={16} strokeWidth={1.5} fill={on ? 'currentColor' : 'none'} />
  </button>
)

function MemoryCard({ m, drawerName, onOpen, onFav, i }) {
  return (
    <motion.li initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * .04, duration: .5, ease: [.22, .8, .2, 1] }} className="relative">
      <button onClick={onOpen} className="group w-full h-full min-h-48 text-left mahogany rounded-xl p-5 pb-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-rose/50 hover:shadow-[0_22px_36px_-18px_rgba(84,43,53,.95)]">
        <div className="flex items-center justify-between gap-3 text-xs text-silver">
          <span className="uppercase tracking-[.14em] text-[11px] truncate">{drawerName ?? 'Loose'}</span>
          <span className="shrink-0">{fmtDate(m.date)}</span>
        </div>
        <h3 className="text-[26px] leading-[1.1] text-parchment">{m.title}</h3>
        <p className="font-display italic text-[18px] leading-snug text-parchment/70 clamp-3">{m.body}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pr-9 min-h-6">
          {m.mood && <Chip>{m.mood}</Chip>}
          {(m.tags ?? []).slice(0, 3).map((t) => <Chip key={t} tone="silver">{t}</Chip>)}
        </div>
      </button>
      <FavStar on={m.favorite} onClick={onFav} className="absolute right-3 bottom-3" />
    </motion.li>
  )
}

function MemoryRow({ m, drawerName, onOpen, onFav }) {
  return (
    <li className="relative">
      <button onClick={onOpen} className="group w-full text-left mahogany rounded-lg pl-4 pr-12 py-3 grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_auto] items-center gap-x-6 gap-y-1 hover:border-rose/50 hover:bg-white/[0.03] transition-colors">
        <div className="min-w-0"><h3 className="text-xl leading-tight truncate">{m.title}</h3><p className="text-xs text-silver">{fmtDate(m.date)}{drawerName ? ` · ${drawerName}` : ''}</p></div>
        <p className="font-display italic text-[17px] text-parchment/65 truncate hidden sm:block">{m.body}</p>
        <div className="flex flex-wrap gap-1.5 sm:justify-end">{m.mood && <Chip>{m.mood}</Chip>}{(m.tags ?? []).slice(0, 2).map((t) => <Chip key={t} tone="silver">{t}</Chip>)}</div>
      </button>
      <FavStar on={m.favorite} onClick={onFav} className="absolute right-2 top-1/2 -translate-y-1/2" />
    </li>
  )
}

/* The keepsake: the original on aged paper, nothing overwritten without consent */
function Keepsake({ id, onClose, onEdit }) {
  const { memories, drawers, upsert, remove, settings } = useArchive()
  const m = memories.find((x) => x.id === id)
  const [tab, setTab] = useState('original')
  const [confirm, setConfirm] = useState(null)
  const task = useAITask()
  const ai = useAI()
  const toast = useToast()
  useEffect(() => { setTab('original'); task.reset() }, [id]) // eslint-disable-line
  if (!m) return null
  const drawer = drawers.find((d) => d.id === m.drawer)
  const versions = m.keepsakes ?? []
  const shown = tab === 'original' ? null : versions.find((v) => v.id === tab)
  const body = shown ? shown.text : m.body
  const aiOn = settings.aiEnabled && ai.supported
  const active = task.phase !== 'idle'

  const launch = (kind) => task.run(kind, `${m.title}\n\n${m.body}`)
  const saveVersion = (text) => {
    const v = { id: uid(), kind: task.task, label: TASKS[task.task].label, text, createdAt: new Date().toISOString() }
    upsert('memories', { ...m, keepsakes: [...versions, v] })
    setTab(v.id); task.reset(); toast('Version kept beside the original')
  }

  return (
    <>
      <Modal open onClose={onClose} label={m.title} wide paperless>
        <div className="mahogany rounded-2xl p-4 sm:p-8">
          <div className="flex justify-end mb-1"><IconButton icon={X} label="Close" onClick={onClose} /></div>
          <div className={cx('grid gap-6 items-start mx-auto', active ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] max-w-6xl' : 'max-w-3xl')}>
            <motion.article layout="position" initial={{ opacity: 0, rotate: -1.2, y: 14 }} animate={{ opacity: 1, rotate: -.3, y: 0 }} transition={{ duration: .6, ease: [.22, .8, .2, 1] }} className="paper p-7 sm:p-12 pb-5">
              {versions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5" role="tablist" aria-label="Versions">
                  {[{ id: 'original', label: 'Original' }, ...versions].map((v) => (
                    <button key={v.id} role="tab" aria-selected={tab === v.id} onClick={() => setTab(v.id)}
                      className={cx('rounded-full px-3 py-1 text-xs border transition-colors', tab === v.id ? 'bg-burgundy-deep text-[#ecdcc0] border-burgundy-deep' : 'border-inkbrown/35 text-inkbrown hover:bg-inkbrown/10')}>{v.label}</button>
                  ))}
                </div>
              )}
              <h2 className="text-4xl sm:text-6xl leading-[1.03] mb-3 text-inkbrown">{m.title}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-inkbrown/75 mb-7">
                <span>{fmtDate(m.date)}</span>{m.mood && <Chip tone="paper">{m.mood}</Chip>}{drawer && <Chip tone="paper">{drawer.name}</Chip>}
              </div>
              <div className="ink text-[22px] sm:text-[26px] leading-[1.6] whitespace-pre-wrap min-h-40">{body}</div>
              {!!m.tags?.length && <div className="flex flex-wrap gap-1.5 mt-7">{m.tags.map((t) => <Chip key={t} tone="paper">{t}</Chip>)}</div>}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-8 pt-3 border-t border-inkbrown/20">
                <div className="flex gap-1">
                  <IconButton paper icon={Pencil} label="Edit memory" onClick={() => onEdit(m)} />
                  <IconButton paper icon={Star} active={m.favorite} label={m.favorite ? 'Remove favourite' : 'Mark favourite'} onClick={() => upsert('memories', { ...m, favorite: !m.favorite })} />
                  <IconButton paper icon={m.archived ? ArchiveRestore : ArchiveIcon} label={m.archived ? 'Restore from archive' : 'Archive'} onClick={() => { upsert('memories', { ...m, archived: !m.archived }); toast(m.archived ? 'Restored' : 'Archived') }} />
                  <IconButton paper icon={Trash2} label="Delete memory" onClick={() => setConfirm('memory')} />
                </div>
                <div className="flex items-center gap-1">
                  {shown && <>
                    <Button size="sm" variant="paperGhost" onClick={() => setConfirm('replace')}>Replace original</Button>
                    <IconButton paper icon={X} label="Delete this version" onClick={() => { upsert('memories', { ...m, keepsakes: versions.filter((v) => v.id !== shown.id) }); setTab('original') }} />
                  </>}
                  <Menu align="right" trigger={({ toggle }) => <Button size="sm" variant="paper" icon={PenLine} disabled={!aiOn || task.phase === 'working'} onClick={toggle}>Transform</Button>}
                    items={[{ label: 'Turn into a poem', icon: Feather, onClick: () => launch('poem') }, { label: 'Literary passage', icon: ScrollText, onClick: () => launch('passage') }, { label: 'Polished keepsake', icon: Gem, onClick: () => launch('keepsake') }]} />
                </div>
              </div>
            </motion.article>
            {active && <SuggestionCard task={task} onUse={saveVersion} useLabel="Keep as a version" onRetry={() => launch(task.task)} onDismiss={task.reset} />}
          </div>
          {!aiOn && <div className="max-w-3xl mx-auto mt-4"><AIStatus compact /></div>}
        </div>
      </Modal>
      <Confirm open={confirm === 'memory'} title="Delete this memory?" onCancel={() => setConfirm(null)} onConfirm={() => { remove('memories', m.id); setConfirm(null); onClose() }} />
      <Confirm open={confirm === 'replace'} title="Replace your original words?" confirmLabel="Replace" onCancel={() => setConfirm(null)}
        onConfirm={() => { upsert('memories', { ...m, keepsakes: [...versions.filter((v) => v.id !== shown.id), { id: uid(), kind: 'original', label: 'Earlier original', text: m.body, createdAt: new Date().toISOString() }], body: shown.text }); setConfirm(null); setTab('original') }} />
    </>
  )
}

function DrawerManager({ open, onClose }) {
  const { drawers, upsert, remove, memories } = useArchive()
  const [name, setName] = useState('')
  const add = () => { if (name.trim()) { upsert('drawers', { id: uid(), name: name.trim(), order: (drawers.at(-1)?.order ?? -1) + 1 }); setName('') } }
  return (
    <Modal open={open} onClose={onClose} label="Drawers">
      <ModalHeader title="Drawers" onClose={onClose} />
      <div className="px-6 pb-6 grid gap-3">
        {drawers.map((d) => (
          <div key={d.id} className="flex items-center gap-2">
            <input className="field" aria-label="Drawer name" defaultValue={d.name} onBlur={(e) => e.target.value.trim() && e.target.value !== d.name && upsert('drawers', { ...d, name: e.target.value.trim() })} />
            <IconButton icon={Trash2} label={`Delete ${d.name}`} onClick={() => { memories.filter((m) => m.drawer === d.id).forEach((m) => upsert('memories', { ...m, drawer: null })); remove('drawers', d.id) }} />
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input data-autofocus className="field" placeholder="New drawer" aria-label="New drawer name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <Button variant="primary" icon={Plus} onClick={add} disabled={!name.trim()}>Add</Button>
        </div>
      </div>
    </Modal>
  )
}

const NO_FILTER = { from: '', to: '', tag: '', mood: '', archived: false }

export default function Cabinet() {
  const { memories, drawers, upsert, settings, updateSettings } = useArchive()
  const [sp, setSp] = useSearchParams()
  const drawerId = sp.get('drawer'), favOnly = sp.get('fav') === '1', openId = sp.get('open')
  const [q, setQ] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [flt, setFlt] = useState(NO_FILTER)
  const [sort, setSort] = useState('new')
  const [editor, setEditor] = useState({ open: false, memory: null })
  const [manage, setManage] = useState(false)
  const layout = settings.layout ?? 'cards'
  const drawerName = (id) => drawers.find((d) => d.id === id)?.name

  const allTags = useMemo(() => [...new Set(memories.flatMap((m) => m.tags ?? []))].sort(), [memories])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return memories
      .filter((m) => !!m.archived === flt.archived)
      .filter((m) => !drawerId || m.drawer === drawerId)
      .filter((m) => !favOnly || m.favorite)
      .filter((m) => !flt.tag || (m.tags ?? []).includes(flt.tag))
      .filter((m) => !flt.mood || m.mood === flt.mood)
      .filter((m) => !flt.from || m.date >= flt.from)
      .filter((m) => !flt.to || m.date <= flt.to)
      .filter((m) => !s || [m.title, m.body, m.mood, (m.tags ?? []).join(' ')].some((x) => (x ?? '').toLowerCase().includes(s)))
      .sort((a, b) => (sort === 'new' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))
  }, [memories, q, drawerId, favOnly, flt, sort])

  const setParam = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }
  const activeFilters = [flt.from, flt.to, flt.tag, flt.mood, flt.archived].filter(Boolean).length
  const title = drawerId ? drawerName(drawerId) ?? 'The Memory Cabinet' : favOnly ? 'Favourites' : 'The Memory Cabinet'
  const newMemory = () => setEditor({ open: true, memory: null })

  return (
    <>
      <PageHeader title={title}>
        <Button variant="primary" icon={Plus} onClick={newMemory} className="max-md:hidden">New memory</Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
        <SearchInput value={q} onChange={setQ} placeholder="Search memories" className="flex-1 min-w-48 sm:max-w-sm" />
        <Button icon={SlidersHorizontal} variant={showFilters || activeFilters ? 'primary' : 'ghost'} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>Filters{activeFilters ? ` · ${activeFilters}` : ''}</Button>
        <div className="ml-auto flex items-center gap-2">
          <IconButton icon={FolderPlus} label="Manage drawers" onClick={() => setManage(true)} />
          <Segmented label="Layout" value={layout} onChange={(v) => updateSettings({ layout: v })} options={[{ id: 'cards', label: 'Cards', icon: LayoutGrid }, { id: 'list', label: 'List', icon: List }]} />
        </div>
      </div>

      {/* mobile drawers: one row, same names as the sidebar */}
      <div className="md:hidden -mx-4 px-4 mb-5 flex gap-2 overflow-x-auto pb-1">
        {[{ k: 'all', label: 'All', on: !drawerId && !favOnly, go: () => setSp({}, { replace: true }) }, { k: 'fav', label: 'Favourites', on: favOnly, go: () => setSp({ fav: '1' }, { replace: true }) },
          ...drawers.map((d) => ({ k: d.id, label: d.name, on: drawerId === d.id, go: () => setSp({ drawer: d.id }, { replace: true }) }))].map((c) => (
          <Chip key={c.k} tone="silver" active={c.on} onClick={c.go} className="!px-3.5 !py-1 !text-sm shrink-0">{c.label}</Chip>
        ))}
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mahogany rounded-xl p-4 mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div><Label htmlFor="f-from">From</Label><input id="f-from" type="date" className="field" value={flt.from} onChange={(e) => setFlt({ ...flt, from: e.target.value })} /></div>
          <div><Label htmlFor="f-to">To</Label><input id="f-to" type="date" className="field" value={flt.to} onChange={(e) => setFlt({ ...flt, to: e.target.value })} /></div>
          <div><Label htmlFor="f-mood">Mood</Label><select id="f-mood" className="field" value={flt.mood} onChange={(e) => setFlt({ ...flt, mood: e.target.value })}><option value="">Any mood</option>{MOODS.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><Label htmlFor="f-tag">Tag</Label><select id="f-tag" className="field" value={flt.tag} onChange={(e) => setFlt({ ...flt, tag: e.target.value })}><option value="">Any tag</option>{allTags.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div className="flex flex-wrap gap-2 items-center h-[42px]">
            <Chip tone="silver" active={sort === 'old'} onClick={() => setSort(sort === 'new' ? 'old' : 'new')} className="!px-3 !py-1.5 !text-sm">{sort === 'new' ? 'Newest first' : 'Oldest first'}</Chip>
            <Chip tone="silver" active={flt.archived} onClick={() => setFlt({ ...flt, archived: !flt.archived })} className="!px-3 !py-1.5 !text-sm">Archived</Chip>
            {activeFilters > 0 && <Button size="sm" variant="quiet" onClick={() => setFlt(NO_FILTER)}>Clear</Button>}
          </div>
        </motion.div>
      )}

      {list.length ? (
        layout === 'cards' ? (
          <ul className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((m, i) => <MemoryCard key={m.id} m={m} i={i} drawerName={drawerName(m.drawer)} onOpen={() => setParam('open', m.id)} onFav={() => upsert('memories', { ...m, favorite: !m.favorite })} />)}
          </ul>
        ) : (
          <ul className="grid gap-2">
            {list.map((m) => <MemoryRow key={m.id} m={m} drawerName={drawerName(m.drawer)} onOpen={() => setParam('open', m.id)} onFav={() => upsert('memories', { ...m, favorite: !m.favorite })} />)}
          </ul>
        )
      ) : (
        <EmptyState art={<CabinetArt className="w-full h-full" />} title={memories.length ? 'Nothing matches' : 'The cabinet is empty'}
          action={memories.length ? (activeFilters || q ? <Button onClick={() => { setFlt(NO_FILTER); setQ('') }}>Clear filters</Button> : null) : <Button variant="primary" icon={Plus} onClick={newMemory}>New memory</Button>} />
      )}

      <Fab label="New memory" icon={Plus} onClick={newMemory} />
      {openId && <Keepsake id={openId} onClose={() => setParam('open', null)} onEdit={(m) => setEditor({ open: true, memory: m })} />}
      <MemoryEditor open={editor.open} memory={editor.memory} seed={drawerId ? { drawer: drawerId } : undefined} onClose={() => setEditor((e) => ({ ...e, open: false }))} onSaved={(m) => !editor.memory && setParam('open', m.id)} />
      <DrawerManager open={manage} onClose={() => setManage(false)} />
    </>
  )
}
