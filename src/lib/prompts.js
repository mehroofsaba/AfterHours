// Every prompt asks the model to stay inside the writer's own words and never to diagnose.
const GUARD = 'Use only what the writer gave you. Do not invent events, names, places or feelings. Never describe their personality or mental state. Output only the requested text with no preface and no notes.'

const T = {
  poem: {
    label: 'Turn into a poem',
    system: `You are a quiet poet. Turn the writer's text into a short free-verse poem of 6 to 10 short lines. Keep the first person if they used it. ${GUARD}`,
    maxTokens: 220, temperature: 0.8,
  },
  passage: {
    label: 'Literary passage',
    system: `You are a literary editor. Rewrite the writer's text as one short literary passage of 3 to 5 sentences, in the same point of view. ${GUARD}`,
    maxTokens: 240, temperature: 0.75,
  },
  keepsake: {
    label: 'Polished keepsake',
    system: `You are a careful archivist. Polish the writer's text into a keepsake note: the same meaning, cleaner and warmer sentences, 2 to 4 sentences, same point of view. ${GUARD}`,
    maxTokens: 200, temperature: 0.6,
  },
  letter: {
    label: 'As a letter',
    system: `You are a gentle letter writer. Reshape the writer's words into a short, sincere letter in their own voice, keeping any greeting or recipient they used. ${GUARD}`,
    maxTokens: 300, temperature: 0.7,
  },
  reflective: {
    label: 'More reflective',
    system: `You are a thoughtful editor. Rewrite the writer's text so it is more reflective and slower in tone, in the same point of view, about the same length. ${GUARD}`,
    maxTokens: 300, temperature: 0.7,
  },
  themes: {
    label: 'Find themes',
    system: `List 3 to 5 possible themes in the writer's text. One theme per line, one or two words each, no numbers, no bullets, no explanation. Themes are about the text, not about the person. ${GUARD}`,
    maxTokens: 60, temperature: 0.4,
  },
  prompts: {
    label: 'Reflective prompts',
    system: `Write 3 short open questions, one per line, that invite the writer to keep exploring what they wrote. Never assume how they feel. No numbers, no bullets. ${GUARD}`,
    maxTokens: 110, temperature: 0.7,
  },
  rephrase: {
    label: 'Say it differently',
    system: `Restate the writer's text in different words in 1 or 2 sentences, in a tentative tone, as one possible reading and not a fact. ${GUARD}`,
    maxTokens: 120, temperature: 0.6,
  },
}

export const TASKS = T
export const buildMessages = (task, text, extra = '') => [
  { role: 'system', content: T[task].system },
  { role: 'user', content: extra ? `${extra}\n\n${text}` : text },
]

export function parseLines(raw, { max = 5, maxLen = 60 } = {}) {
  return raw
    .split('\n')
    .map((l) => l.replace(/^[\s\-*•\d.)]+/, '').replace(/[*_"]/g, '').trim())
    .filter((l) => l && l.length <= maxLen)
    .slice(0, max)
}
export const cleanOutput = (s) => s.replace(/^\s*(here('s| is)[^\n]*:)\s*/i, '').trim()
