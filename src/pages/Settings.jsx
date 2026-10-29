import { useRef, useState } from 'react'
import { AlertTriangle, Download, LayoutGrid, List, RefreshCw, Trash2, Upload } from 'lucide-react'
import { Button, Chip, Confirm, Segmented } from '../components/ui.jsx'
import { useArchive } from '../lib/store.jsx'
import { loadModel, removeModelCache, selectModel, useAI } from '../lib/ai.js'
import { MODELS, getModel } from '../lib/models.js'
import { exportArchive, readArchiveFile } from '../lib/archiveIO.js'
import { sampleArchive } from '../lib/sample.js'
import { useToast } from '../lib/toast.jsx'
import { cx } from '../lib/utils.js'

/* One grid for every section: label on the left, control on the right, same edges everywhere. */
function Section({ title, children }) {
  return (
    <section aria-label={title}>
      <h2 className="text-2xl mb-3">{title}</h2>
      <div className="mahogany rounded-2xl divide-y divide-silver/10">{children}</div>
    </section>
  )
}
function Row({ label, hint, htmlFor, children, disabled, full }) {
  return (
    <div className={cx('grid gap-x-8 gap-y-2.5 px-5 sm:px-6 py-4 sm:items-center', full ? '' : 'sm:grid-cols-[minmax(0,1fr)_auto]', disabled && 'opacity-50')}>
      {label && (
        <div className="min-w-0">
          <label htmlFor={htmlFor} className="block text-[15px] text-parchment">{label}</label>
          {hint && <p className="text-[13px] text-silver mt-0.5">{hint}</p>}
        </div>
      )}
      {children && <div className={cx('flex flex-wrap items-center gap-2 sm:justify-end', full && 'w-full')}>{children}</div>}
    </div>
  )
}

function Switch({ checked, onChange, id, label }) {
  return (
    <button id={id} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative w-12 h-7 rounded-full border transition-colors duration-300 shrink-0', checked ? 'bg-burgundy border-rose/60' : 'bg-white/5 border-silver/30')}>
      <span className={cx('absolute top-[3px] left-[3px] size-5 rounded-full transition-transform duration-300', checked ? 'translate-x-5 bg-parchment' : 'bg-silver')} />
    </button>
  )
}

export default function Settings() {
  const state = useArchive()
  const { settings, updateSettings, drawers, memories, fragments, letters, upsert, replaceAll, eraseAll, persistent } = state
  const ai = useAI()
  const toast = useToast()
  const fileRef = useRef(null)
  const [erase, setErase] = useState(false)
  const [importing, setImporting] = useState(null)
  const model = getModel(settings.modelId)
  const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu
  const empty = !memories.length && !fragments.length && !letters.length
  const off = !settings.aiEnabled

  const statusText = !ai.supported ? 'Unavailable in this browser'
    : ai.status === 'ready' ? `Ready on ${ai.device === 'webgpu' ? 'GPU' : 'CPU'}`
    : ai.status === 'loading' ? 'Downloading'
    : ai.status === 'error' ? 'Failed'
    : ai.cached ? 'Saved on this device' : 'Not downloaded'
  const pct = Math.round((ai.progress || 0) * 100)

  const onFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    try { setImporting(await readArchiveFile(file)) } catch (err) { toast(err.message) }
  }
  const addSample = () => {
    const s = sampleArchive(drawers)
    s.memories.forEach((m) => upsert('memories', m)); s.fragments.forEach((f) => upsert('fragments', f)); s.letters.forEach((l) => upsert('letters', l))
    toast('Sample entries added')
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <h1 className="text-3xl sm:text-4xl mb-8">Settings</h1>
      <div className="grid gap-9">
        <Section title="Local AI">
          <Row label="Use local AI" htmlFor="ai-on"><Switch id="ai-on" checked={settings.aiEnabled} onChange={(v) => updateSettings({ aiEnabled: v })} label="Use local AI" /></Row>
          <Row label="Model" htmlFor="model" hint={`${model.licence} licence · ${model.size}`} disabled={off}>
            <select id="model" disabled={off} className="field sm:w-64" value={settings.modelId} onChange={(e) => { updateSettings({ modelId: e.target.value }); selectModel(e.target.value) }}>
              {MODELS.map((m) => <option key={m.id} value={m.id} disabled={m.webgpuOnly && !hasWebGPU}>{m.name}{m.webgpuOnly && !hasWebGPU ? ' (needs WebGPU)' : ''}</option>)}
            </select>
          </Row>
          <Row label="Status" disabled={off}>
            <Chip tone={ai.status === 'ready' ? 'burgundy' : 'silver'} className="!text-[13px] !px-3 !py-1">{statusText}</Chip>
            {ai.supported && ai.status !== 'ready' && ai.status !== 'loading' && !ai.cached && <Button size="sm" icon={Download} disabled={off} onClick={() => loadModel().catch(() => {})}>Download</Button>}
            {ai.supported && ai.status !== 'ready' && ai.status !== 'loading' && ai.cached && <Button size="sm" disabled={off} onClick={() => loadModel().catch(() => {})}>Load</Button>}
            {(ai.cached || ai.status === 'ready') && ai.status !== 'loading' && <Button size="sm" variant="danger" icon={Trash2} onClick={() => { removeModelCache(); toast('Model removed from this device') }}>Remove</Button>}
          </Row>
          {ai.status === 'loading' && (
            <Row full>
              <div className="w-full" role="status">
                <div className="flex justify-between text-[13px] text-silver mb-1.5"><span>Downloading {model.name}</span><span>{ai.progress > 0 ? `${pct}%` : 'Preparing'}</span></div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-rose transition-[width] duration-300" style={{ width: `${Math.max(pct, 4)}%` }} /></div>
              </div>
            </Row>
          )}
          {ai.status === 'error' && (
            <Row full>
              <div className="w-full flex flex-wrap items-center justify-between gap-3 text-sm text-[#e6b9be]">
                <span className="flex items-center gap-2"><AlertTriangle size={15} aria-hidden="true" />{ai.error}</span>
                <Button size="sm" icon={RefreshCw} onClick={() => loadModel().catch(() => {})}>Retry</Button>
              </div>
            </Row>
          )}
        </Section>

        <Section title="Ambience">
          <Row label="Moving light and dust" htmlFor="amb"><Switch id="amb" checked={settings.ambient} onChange={(v) => updateSettings({ ambient: v })} label="Moving light and dust" /></Row>
        </Section>

        <Section title="Appearance">
          <Row label="Reading size"><Segmented label="Reading size" value={settings.textSize ?? 'normal'} onChange={(v) => updateSettings({ textSize: v })} options={[{ id: 'normal', text: 'Normal', label: 'Normal text' }, { id: 'large', text: 'Large', label: 'Large text' }]} /></Row>
          <Row label="Memory layout"><Segmented label="Memory layout" value={settings.layout ?? 'cards'} onChange={(v) => updateSettings({ layout: v })} options={[{ id: 'cards', text: 'Cards', icon: LayoutGrid, label: 'Cards' }, { id: 'list', text: 'List', icon: List, label: 'List' }]} /></Row>
        </Section>

        <Section title="Storage">
          <Row label="Location" hint={persistent ? undefined : 'This browser blocked storage. Entries will be lost when you close the tab.'}>
            <Chip tone={persistent ? 'silver' : 'burgundy'} className="!text-[13px] !px-3 !py-1">{persistent ? 'This browser, this device' : 'Not saved'}</Chip>
          </Row>
          <Row label="Back up"><Button icon={Download} onClick={() => exportArchive(state)} disabled={empty}>Export archive</Button></Row>
          <Row label="Restore"><Button icon={Upload} onClick={() => fileRef.current?.click()}>Import archive</Button><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} /></Row>
        </Section>

        <Section title="Data">
          {empty && <Row label="Sample entries"><Button onClick={addSample}>Add samples</Button></Row>}
          <Row label="Erase everything"><Button icon={Trash2} variant="danger" onClick={() => setErase(true)} disabled={empty}>Erase archive</Button></Row>
        </Section>
      </div>

      <Confirm open={erase} title="Erase every memory, fragment and letter?" confirmLabel="Erase" onCancel={() => setErase(false)} onConfirm={() => { eraseAll(); setErase(false); toast('Archive erased') }} />
      <Confirm open={!!importing} title="Merge this archive with what is here?" confirmLabel="Merge" onCancel={() => setImporting(null)} onConfirm={() => { replaceAll(importing, { merge: true }); setImporting(null); toast('Archive imported') }} />
    </div>
  )
}
