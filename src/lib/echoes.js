// Local, transparent "echoes": which saved writing shares meaningful words with a fragment.
// No model involved, so the reason for every suggestion is visible to the writer.
const STOP = new Set(
  'about after again also because been before being could does doing down from have here into just more most once only other over same some such than that their them then there these they this those through under until very were what when where which while will with would your dont didnt cant wasnt like felt feel feeling thing things'.split(' '),
)

const stem = (w) => (w.length > 5 ? w.replace(/(ing|ed|es|s)$/, '') : w.replace(/s$/, ''))

export const words = (text = '') =>
  [...new Set((text.toLowerCase().match(/[a-z']{4,}/g) ?? []).map((w) => stem(w.replace(/'s$/, ''))).filter((w) => w.length > 3 && !STOP.has(w)))]

export function findEchoes(text, candidates, { limit = 4 } = {}) {
  const mine = new Set(words(text))
  if (!mine.size) return []
  return candidates
    .map((item) => ({ item, shared: words(`${item.title ?? ''} ${item.body ?? item.text ?? ''}`).filter((w) => mine.has(w)) }))
    .filter((r) => r.shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length)
    .slice(0, limit)
}
