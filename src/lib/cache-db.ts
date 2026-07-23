import type { CacheAccessRecord, CacheManager } from "./cache-types"

const CACHE_NAME = "plot-images"

const DB_NAME = "PlotImageCacheDB"
const STORE_NAME = "accessTimes"
const DB_VERSION = 1
const INDEX_LAST_ACCESS = "lastAccess"
const INDEX_CACHED_AT = "cachedAt"

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "url" })
        store.createIndex(INDEX_LAST_ACCESS, "lastAccess", { unique: false })
        store.createIndex(INDEX_CACHED_AT, "cachedAt", { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

export async function recordAccess(url: string): Promise<void> {
  try {
    const db = await openDB()
    const now = Date.now()

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)

      const getReq = store.get(url)
      getReq.onsuccess = () => {
        const existing = getReq.result as CacheAccessRecord | undefined
        const record: CacheAccessRecord = {
          url,
          lastAccess: now,
          cachedAt: existing?.cachedAt ?? now,
          accessCount: (existing?.accessCount ?? 0) + 1,
        }
        store.put(record)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn("[CacheDB] recordAccess failed:", e)
  }
}

export async function getExpiredUrls(maxAgeMs: number): Promise<string[]> {
  try {
    const db = await openDB()
    const cutoff = Date.now() - maxAgeMs

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const index = store.index(INDEX_LAST_ACCESS)
      const range = IDBKeyRange.upperBound(cutoff, true)
      const request = index.getAllKeys(range)

      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn("[CacheDB] getExpiredUrls failed:", e)
    return []
  }
}

export async function deleteUrls(urls: string[]): Promise<void> {
  if (urls.length === 0) return

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)

      for (const url of urls) {
        store.delete(url)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn("[CacheDB] deleteUrls failed:", e)
  }
}

export async function getAllUrls(): Promise<string[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAllKeys()
      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn("[CacheDB] getAllUrls failed:", e)
    return []
  }
}

export async function clearAllUrls(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      store.clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn("[CacheDB] clearAllUrls failed:", e)
  }
}

export async function deleteFromCacheAPI(urls: string[]): Promise<void> {
  if (urls.length === 0) return
  try {
    const cache = await caches.open(CACHE_NAME)
    await Promise.all(urls.map((url) => cache.delete(url)))
  } catch (e) {
    console.warn("[CacheDB] deleteFromCacheAPI failed:", e)
  }
}

export const cacheManager: CacheManager = {
  recordAccess,
  getExpiredUrls,
  deleteUrls,
  async runCleanup(maxAgeMs) {
    const start = Date.now()
    const errors: string[] = []

    try {
      const expiredUrls = await getExpiredUrls(maxAgeMs)
      await deleteUrls(expiredUrls)

      return {
        scanned: 0,
        deleted: expiredUrls.length,
        errors,
        durationMs: Date.now() - start,
      }
    } catch (e) {
      errors.push(String(e))
      return { scanned: 0, deleted: 0, errors, durationMs: Date.now() - start }
    }
  },
}
