import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, Check, Download, RefreshCw, Square } from 'lucide-react'
import { Button } from './ui.jsx'
import { cancelGeneration, generate, getAIState, loadModel, useAI } from '../lib/ai.js'
import { getModel } from '../lib/models.js'
import { TASKS, buildMessages, cleanOutput } from '../lib/prompts.js'
import { useArchive } from '../lib/store.jsx'
import { Link } from 'react-router-dom'

const pct = (p) => `${Math.round(p * 100)}%`
const mb = (n) => (n ? `${(n / 1048576).toFixed(0)} MB` : '')

/** Runs one AI task and renders every state honestly: unavailable, downloading, thinking, result, failure. */
export function useAITask() {
  const [state, setState] = useState({ phase: 'idle', task: null, text: '', error: null })
  const pending = useRef(null)
  const run = async (task, text, extra, force = false) => {
    const a = getAIState()
    // downloading a model is the person's decision, never a side effect
    if (!force && a.status !== 'ready' && a.status !== 'loading' && !a.cached) {
      pending.current = { task, text, extra }
      setState({ phase: 'needs-model', task, text: '', error: null })
      return
    }
    setState({ phase: 'working', task, text: '', error: null })
    try {
      const { text: out, interrupted } = await generate(buildMessages(task, text, extra), {
        maxTokens: TASKS[task].maxTokens, temperature: TASKS[task].temperature,
        onToken: (t) => setState((s) => (s.phase === 'working' ? { ...s, text: s.text + t } : s)),
      })
      const clean = cleanOutput(out)
      if (!clean) throw new Error('The model returned nothing. Try again.')
      setState({ phase: 'done', task, text: clean, error: null, interrupted })
    } catch (e) {
      setState({ phase: 'error', task, text: '', error: e.message })
    }
  }
  const reset = () => { pending.current = null; setState({ phase: 'idle', task: null, text: '', error: null }) }
  const confirm = () => { const p = pending.current; if (p) run(p.task, p.text, p.extra, true) }
  return { ...state, run, reset, confirm }
}

export function AIStatus({ compact = false }) {
  const ai = useAI()
  const { settings } = useArchive()
  const model = getModel(ai.modelId)
  if (!settings.aiEnabled) {
    return <p className="text-sm text-silver">Local AI is switched off. <Link to="/settings" className="underline decoration-rose/60 underline-offset-4 hover:text-parchment">Settings</Link></p>
  }
  if (!ai.supported) {
    return <p className="flex items-center gap-2 text-sm text-[#e6b9be]"><AlertTriangle size={15} aria-hidden="true" />This browser cannot run local AI.</p>
  }
  if (ai.status === 'loading') {
    return (
      <div className="w-full" role="status">
        <div className="flex justify-between text-sm text-silver mb-1.5">
          <span>{ai.progress > 0 && ai.progress < 1 ? `Downloading ${model.name}` : `Preparing ${model.name}`}</span>
          <span>{ai.totalBytes ? `${mb(ai.loadedBytes)} / ${mb(ai.totalBytes)}` : pct(ai.progress)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-rose transition-[width] duration-300" style={{ width: pct(ai.progress || 0.04) }} /></div>
      </div>
    )
  }
  if (ai.status === 'error') {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-2 text-[#e6b9be]"><AlertTriangle size={15} aria-hidden="true" />{ai.error}</span>
        <Button size="sm" icon={RefreshCw} onClick={() => loadModel().catch(() => {})}>Retry</Button>
      </div>
    )
  }
  if (compact) return null
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-silver">
      {ai.status === 'ready' ? <span className="flex items-center gap-2"><Check size={15} className="text-rose" aria-hidden="true" />{model.name} ready on {ai.device === 'webgpu' ? 'GPU' : 'CPU'}</span>
        : <><span>{ai.cached ? `${model.name} is saved on this device` : `${model.name} is not downloaded`}</span>
          <Button size="sm" icon={Download} onClick={() => loadModel().catch(() => {})}>{ai.cached ? 'Load' : `Download (${model.size})`}</Button></>}
    </div>
  )
}

export function NeedsModel({ onConfirm, onCancel }) {
  const ai = useAI()
  const m = getModel(ai.modelId)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-parchment/90">Local AI needs a one-time download of {m.name} ({m.size}). It stays on this device.</p>
      <div className="flex gap-2"><Button variant="primary" size="sm" icon={Download} onClick={onConfirm}>Download and continue</Button><Button variant="quiet" size="sm" onClick={onCancel}>Not now</Button></div>
    </div>
  )
}

/** The suggestion card. Nothing is applied until the person presses a button. */
export function SuggestionCard({ task, label, children, onUse, useLabel = 'Use this', onRetry, onDismiss, extraActions, editable = true }) {
  const [draft, setDraft] = useState(task.text)
  const taRef = useRef(null)
  useEffect(() => { setDraft(task.text) }, [task.text, task.phase])
  useEffect(() => { if (task.phase === 'working' && taRef.current) taRef.current.scrollTop = taRef.current.scrollHeight }, [task.text, task.phase])
  const ai = useAI()

  if (task.phase === 'idle') return null
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}
      className="mahogany rounded-2xl p-4 sm:p-5 flex flex-col gap-4" aria-live="polite" aria-label="AI suggestion">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl">{label ?? TASKS[task.task]?.label}</h3>
        {task.phase === 'working' && <Button size="sm" icon={Square} onClick={cancelGeneration}>Stop</Button>}
      </div>

      {task.phase === 'needs-model' && <NeedsModel onConfirm={task.confirm} onCancel={onDismiss} />}
      {task.phase === 'working' && ai.status === 'loading' && <AIStatus compact />}
      {task.phase === 'working' && ai.status !== 'loading' && !task.text && (
        <div className="h-16 rounded-lg shimmer border border-silver/15 flex items-center px-4 text-sm text-silver" role="status">Thinking on this device…</div>
      )}
      {task.phase === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="flex items-start gap-2 text-sm text-[#e6b9be]"><AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{task.error}</p>
          <div className="flex gap-2"><Button size="sm" icon={RefreshCw} onClick={onRetry}>Try again</Button><Button size="sm" variant="quiet" onClick={onDismiss}>Dismiss</Button></div>
        </div>
      )}
      {(task.phase === 'done' || (task.phase === 'working' && task.text)) && (
        <>
          {children ? children(task.text, draft, setDraft) : (
            <textarea ref={taRef} value={task.phase === 'done' ? draft : task.text} onChange={(e) => setDraft(e.target.value)} readOnly={task.phase !== 'done' || !editable}
              rows={8} aria-label="Suggestion text" className="field font-display text-lg leading-relaxed resize-y min-h-40" />
          )}
          {task.phase === 'done' && (
            <div className="flex flex-wrap gap-2">
              {onUse && <Button variant="primary" icon={Check} onClick={() => onUse(draft)}>{useLabel}</Button>}
              {extraActions?.(draft)}
              <Button icon={RefreshCw} onClick={onRetry}>Try again</Button>
              <Button variant="quiet" onClick={onDismiss}>Ignore</Button>
            </div>
          )}
        </>
      )}
    </motion.section>
  )
}
