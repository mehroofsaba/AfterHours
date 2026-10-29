import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as db from './db.js'
import { uid } from './utils.js'
import { DEFAULT_MODEL } from './models.js'

const DEFAULT_DRAWERS = ['People', 'Places', 'Versions of Me', 'Almost Forgotten']
export const DEFAULT_SETTINGS = { aiEnabled: true, modelId: DEFAULT_MODEL, ambient: true, seeded: false, layout: 'cards', textSize: 'normal' }

const Ctx = createContext(null)
export const useArchive = () => useContext(Ctx)

export function ArchiveProvider({ children }) {
  const [state, setState] = useState({
    ready: false, persistent: true,
    memories: [], fragments: [], letters: [], drawers: [], settings: DEFAULT_SETTINGS,
  })
  const stateRef = useRef(state)
  stateRef.current = state
  const queue = useRef(Promise.resolve())
  const persist = useCallback((fn) => {
    if (!stateRef.current.persistent) return
    queue.current = queue.current.then(fn).catch(() => setState((s) => ({ ...s, persistent: false })))
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const [memories, fragments, letters, drawers, settingRows] = await Promise.all(
          ['memories', 'fragments', 'letters', 'drawers', 'settings'].map(db.getAll),
        )
        const settings = { ...DEFAULT_SETTINGS, ...Object.fromEntries(settingRows.map((r) => [r.key, r.value])) }
        let d = drawers
        if (!settings.seeded && drawers.length === 0) {
          d = DEFAULT_DRAWERS.map((name, i) => ({ id: uid(), name, order: i }))
          await db.putMany('drawers', d)
          await db.put('settings', { key: 'seeded', value: true })
          settings.seeded = true
        }
        setState({ ready: true, persistent: true, memories, fragments, letters, drawers: d.sort((a, b) => a.order - b.order), settings })
      } catch {
        const d = DEFAULT_DRAWERS.map((name, i) => ({ id: uid(), name, order: i }))
        setState((s) => ({ ...s, ready: true, persistent: false, drawers: d }))
      }
    })()
  }, [])

  const upsert = useCallback((store, item) => {
    const stamped = { ...item, updatedAt: new Date().toISOString() }
    setState((s) => {
      const list = s[store]
      const i = list.findIndex((x) => x.id === stamped.id)
      const next = i >= 0 ? list.map((x, j) => (j === i ? stamped : x)) : [stamped, ...list]
      return { ...s, [store]: store === 'drawers' ? next.sort((a, b) => a.order - b.order) : next }
    })
    persist(() => db.put(store, stamped))
    return stamped
  }, [persist])

  const remove = useCallback((store, id) => {
    setState((s) => ({ ...s, [store]: s[store].filter((x) => x.id !== id) }))
    persist(() => db.remove(store, id))
  }, [persist])

  const updateSettings = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
    Object.entries(patch).forEach(([key, value]) => persist(() => db.put('settings', { key, value })))
  }, [persist])

  const replaceAll = useCallback((data, { merge }) => {
    setState((s) => {
      const mergeBy = (a, b) => { const m = new Map(a.map((x) => [x.id, x])); b.forEach((x) => m.set(x.id, x)); return [...m.values()] }
      const next = merge
        ? { memories: mergeBy(s.memories, data.memories), fragments: mergeBy(s.fragments, data.fragments), letters: mergeBy(s.letters, data.letters), drawers: mergeBy(s.drawers, data.drawers) }
        : { memories: data.memories, fragments: data.fragments, letters: data.letters, drawers: data.drawers }
      next.drawers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      persist(async () => {
        for (const k of ['memories', 'fragments', 'letters', 'drawers']) {
          if (!merge) await db.clear(k)
          await db.putMany(k, next[k])
        }
      })
      return { ...s, ...next }
    })
  }, [persist])

  const eraseAll = useCallback(() => {
    setState((s) => ({ ...s, memories: [], fragments: [], letters: [] }))
    persist(async () => { for (const k of ['memories', 'fragments', 'letters']) await db.clear(k) })
  }, [persist])

  const value = useMemo(() => ({ ...state, upsert, remove, updateSettings, replaceAll, eraseAll }), [state, upsert, remove, updateSettings, replaceAll, eraseAll])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
