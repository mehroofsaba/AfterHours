// Small open-weight instruct models that run in the browser through Transformers.js (ONNX).
// Sizes are approximate downloads. Confirm licences on each model card before shipping.
export const MODELS = [
  {
    id: 'onnx-community/SmolLM2-360M-Instruct',
    name: 'SmolLM2 360M',
    size: 'about 0.3 GB',
    licence: 'Apache-2.0',
    note: 'Default. Fast enough on an ordinary laptop.',
    webgpuOnly: false,
  },
  {
    id: 'onnx-community/Qwen2.5-0.5B-Instruct',
    name: 'Qwen2.5 0.5B',
    size: 'about 0.4 GB',
    licence: 'Apache-2.0',
    note: 'Slightly more fluent, slightly slower.',
    webgpuOnly: false,
  },
  {
    id: 'onnx-community/SmolLM2-135M-Instruct',
    name: 'SmolLM2 135M',
    size: 'about 0.1 GB',
    licence: 'Apache-2.0',
    note: 'Smallest. Best for older devices; simpler writing.',
    webgpuOnly: false,
  },
  {
    id: 'onnx-community/Phi-3.5-mini-instruct-onnx-web',
    name: 'Phi-3.5 mini',
    size: 'about 2 GB',
    licence: 'MIT',
    note: 'Best writing. Needs WebGPU and a capable machine.',
    webgpuOnly: true,
  },
]
export const DEFAULT_MODEL = MODELS[0].id
export const getModel = (id) => MODELS.find((m) => m.id === id) ?? MODELS[0]
