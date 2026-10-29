// Client for the local model worker. State is observable so the UI can show honest progress.
import { useSyncExternalStore } from 'react'
import { DEFAULT_MODEL, getModel } from './models.js'

let state = {
  status: 'idle', // idle | loading | ready | error
  progress: 0,
  device: null,
  modelId: DEFAULT_MODEL,
  error: null,
  cached: false,
  supported: typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined',
}
const listeners = new Set()
const friendly = (m = '') =>
  /fetch|network|load failed|NetworkError/i.test(m) ? 'The model could not be downloaded. Check your connection and try again.'
  : /memory|allocation|out of/i.test(m) ? 'This device ran out of memory. Try a smaller model in Settings.' : m
const set = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
export const useAI = () => useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => state)
export const getAIState = () => state

let worker = null
let loadWaiters = []
const jobs = new Map()
let counter = 0

function ensureWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./ai.worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') {
      set({ progress: data.total ? Math.min(1, data.loaded / data.total) : 0, loadedBytes: data.loaded, totalBytes: data.total })
    } else if (data.type === 'ready') {
      set({ status: 'ready', progress: 1, device: data.device, error: null, cached: true })
      loadWaiters.splice(0).forEach((w) => w.resolve())
    } else if (data.type === 'token') {
      jobs.get(data.id)?.onToken?.(data.text)
    } else if (data.type === 'done') {
      jobs.get(data.id)?.resolve({ text: data.text, interrupted: data.interrupted })
      jobs.delete(data.id)
    } else if (data.type === 'error') {
      const job = jobs.get(data.id)
      if (job) { job.reject(new Error(friendly(data.message))); jobs.delete(data.id) }
      else {
        set({ status: 'error', error: friendly(data.message) })
        loadWaiters.splice(0).forEach((w) => w.reject(new Error(friendly(data.message))))
      }
    }
  }
  worker.onerror = (e) => {
    const message = e.message || 'The AI worker stopped unexpectedly.'
    set({ status: 'error', error: message })
    loadWaiters.splice(0).forEach((w) => w.reject(new Error(message)))
    jobs.forEach((j) => j.reject(new Error(message))); jobs.clear()
    worker = null
  }
  return worker
}

export async function checkCached(modelId = state.modelId) {
  try {
    if (!('caches' in self)) return set({ cached: false })
    const cache = await caches.open('transformers-cache')
    const keys = await cache.keys()
    const hit = keys.some((r) => r.url.includes(modelId) && r.url.includes('.onnx'))
    set({ cached: hit })
    return hit
  } catch { set({ cached: false }) }
}

export async function selectModel(modelId) {
  if (modelId === state.modelId) return
  worker?.terminate(); worker = null
  jobs.forEach((j) => j.reject(new Error('Model changed.'))); jobs.clear()
  set({ modelId, status: 'idle', progress: 0, device: null, error: null })
  await checkCached(modelId)
}

export function loadModel() {
  if (state.status === 'ready') return Promise.resolve()
  if (state.status === 'loading') return new Promise((resolve, reject) => loadWaiters.push({ resolve, reject }))
  const m = getModel(state.modelId)
  set({ status: 'loading', progress: 0, error: null })
  const p = new Promise((resolve, reject) => loadWaiters.push({ resolve, reject }))
  ensureWorker().postMessage({ type: 'load', modelId: m.id, webgpuOnly: m.webgpuOnly })
  return p
}

export async function removeModelCache() {
  worker?.terminate(); worker = null
  try {
    const cache = await caches.open('transformers-cache')
    const keys = await cache.keys()
    await Promise.all(keys.filter((r) => r.url.includes(state.modelId)).map((r) => cache.delete(r)))
  } catch { /* nothing cached */ }
  set({ status: 'idle', progress: 0, device: null, cached: false })
}

export async function generate(messages, { onToken, maxTokens, temperature } = {}) {
  await loadModel()
  const id = ++counter
  return new Promise((resolve, reject) => {
    jobs.set(id, { resolve, reject, onToken })
    worker.postMessage({ type: 'generate', id, messages, maxTokens, temperature })
    jobs.get(id).cancel = () => worker?.postMessage({ type: 'interrupt' })
    activeJob = id
  })
}
let activeJob = null
export const cancelGeneration = () => { jobs.get(activeJob)?.cancel?.(); worker?.postMessage({ type: 'interrupt' }) }
