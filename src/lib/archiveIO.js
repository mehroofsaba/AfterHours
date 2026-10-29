import { downloadBlob, todayISO } from './utils.js'

export function exportArchive(state) {
  const payload = {
    app: 'AFTERHOURS', version: 1, exportedAt: new Date().toISOString(),
    drawers: state.drawers, memories: state.memories, fragments: state.fragments, letters: state.letters,
    settings: state.settings,
  }
  downloadBlob(`afterhours-archive-${todayISO()}.json`, JSON.stringify(payload, null, 2))
}

export async function readArchiveFile(file) {
  const data = JSON.parse(await file.text())
  if (data?.app !== 'AFTERHOURS') throw new Error('This file is not an AFTERHOURS archive.')
  const arr = (x) => (Array.isArray(x) ? x : [])
  return { drawers: arr(data.drawers), memories: arr(data.memories), fragments: arr(data.fragments), letters: arr(data.letters) }
}
