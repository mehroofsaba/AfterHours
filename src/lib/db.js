// Minimal IndexedDB wrapper. Everything the user writes lives here, in this browser only.
const NAME = 'afterhours'
const VERSION = 1
export const STORES = { memories: 'id', fragments: 'id', letters: 'id', drawers: 'id', settings: 'key' }

let dbPromise = null
export function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'))
    const req = indexedDB.open(NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      for (const [name, keyPath] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB blocked'))
  })
  return dbPromise
}

const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error) })

export async function getAll(store) {
  const db = await openDB()
  return wrap(db.transaction(store).objectStore(store).getAll())
}
export async function put(store, value) {
  const db = await openDB()
  return wrap(db.transaction(store, 'readwrite').objectStore(store).put(value))
}
export async function putMany(store, values) {
  const db = await openDB()
  const tx = db.transaction(store, 'readwrite')
  values.forEach((v) => tx.objectStore(store).put(v))
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
}
export async function remove(store, key) {
  const db = await openDB()
  return wrap(db.transaction(store, 'readwrite').objectStore(store).delete(key))
}
export async function clear(store) {
  const db = await openDB()
  return wrap(db.transaction(store, 'readwrite').objectStore(store).clear())
}
