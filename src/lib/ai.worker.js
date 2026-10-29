// Runs the model off the main thread so the archive never freezes while thinking.
import { pipeline, TextStreamer, InterruptableStoppingCriteria, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let generator = null
let loadedId = null
let device = null
const stopper = new InterruptableStoppingCriteria()
const post = (m) => self.postMessage(m)

async function load(modelId, webgpuOnly) {
  if (generator && loadedId === modelId) return post({ type: 'ready', device })
  generator = null
  loadedId = null

  const files = new Map()
  const progress_callback = (p) => {
    if (p.status === 'progress' && p.file && p.total) {
      files.set(p.file, { loaded: p.loaded, total: p.total })
      let loaded = 0, total = 0
      files.forEach((f) => { loaded += f.loaded; total += f.total })
      post({ type: 'progress', loaded, total })
    } else if (p.status === 'ready') {
      post({ type: 'progress', loaded: 1, total: 1 })
    }
  }

  const hasGPU = !!self.navigator?.gpu
  const attempts = []
  if (hasGPU) attempts.push({ device: 'webgpu', dtype: 'q4f16' })
  if (!webgpuOnly) attempts.push({ device: 'wasm', dtype: 'q8' }, { device: 'wasm', dtype: 'q4' })
  if (!attempts.length) throw new Error('This model needs WebGPU, which this browser does not provide.')

  let lastError
  for (const a of attempts) {
    try {
      files.clear()
      generator = await pipeline('text-generation', modelId, { ...a, progress_callback })
      loadedId = modelId
      device = a.device
      return post({ type: 'ready', device })
    } catch (e) {
      lastError = e
    }
  }
  throw lastError ?? new Error('The model could not be loaded.')
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      await load(data.modelId, data.webgpuOnly)
    } else if (data.type === 'interrupt') {
      stopper.interrupt()
    } else if (data.type === 'generate') {
      if (!generator) throw new Error('The model is not loaded.')
      stopper.reset()
      const streamer = new TextStreamer(generator.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text) => post({ type: 'token', id: data.id, text }),
      })
      const out = await generator(data.messages, {
        max_new_tokens: data.maxTokens ?? 280,
        do_sample: true,
        temperature: data.temperature ?? 0.7,
        top_p: 0.9,
        repetition_penalty: 1.12,
        streamer,
        stopping_criteria: stopper,
      })
      const last = out?.[0]?.generated_text
      const text = Array.isArray(last) ? last.at(-1)?.content ?? '' : String(last ?? '')
      post({ type: 'done', id: data.id, text, interrupted: stopper.interrupted })
    }
  } catch (e) {
    post({ type: 'error', id: data.id, message: e?.message ?? String(e) })
  }
}
