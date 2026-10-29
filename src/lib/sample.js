import { uid, todayISO } from './utils.js'

export function sampleArchive(drawers) {
  const d = (name) => drawers.find((x) => x.name === name)?.id ?? null
  const now = new Date().toISOString()
  const memories = [
    { title: 'A rainy afternoon', date: '2023-04-12', mood: 'Peace', tags: ['rain', 'home'], drawer: d('Almost Forgotten'), favorite: true,
      body: 'The kind of day that made nothing feel urgent. Rain on the window, tea going cold beside me, and for once I did not mind the quiet.' },
    { title: 'The old library', date: '2022-11-03', mood: 'Nostalgia', tags: ['books', 'childhood'], drawer: d('Places'), favorite: false,
      body: 'It smelled of paper and radiator dust. I used to hide in the third aisle and read until the lights flickered for closing.' },
    { title: 'You in 2019', date: '2019-02-14', mood: 'Growth', tags: ['change'], drawer: d('Versions of Me'), favorite: true,
      body: 'I was so sure of the wrong things. I would like to tell that version of me that being unsure later turned out to be fine.' },
  ].map((m) => ({ id: uid(), keepsakes: [], archived: false, createdAt: now, updatedAt: now, ...m }))
  const fragments = [
    { text: 'I was walking through a house that was not mine, but I felt like it had always been there.', kind: 'Dream' },
    { text: 'What if the quiet is not the absence of something?', kind: 'Question' },
    { text: 'The colour of the window at that hour, before anyone speaks.', kind: '' },
  ].map((f, i) => ({ id: uid(), themes: [], prompts: [], notes: [], links: [], memoryLinks: [], createdAt: new Date(Date.now() - i * 86400000 * 9).toISOString(), ...f }))
  const letters = [
    { to: 'The version of me who stayed up too late', recipient: 'past-self', status: 'kept', favorite: true,
      body: 'I wish I had told you that you were enough, even when you felt like you were not.\n\nYou were always enough.' },
    { to: 'A letter to you', recipient: 'someone', status: 'draft', favorite: false, body: 'I keep starting this and stopping. I think what I wanted to say is' },
  ].map((l) => ({ id: uid(), versions: [], createdAt: now, updatedAt: now, date: todayISO(), ...l }))
  return { memories, fragments, letters }
}
