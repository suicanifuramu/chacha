import { useEffect, useState } from "react"
import { cacheManager } from "@/lib/cache-db"
import {
  fetchPromises,
  memoryCache,
  subscribeToCacheClear,
} from "@/lib/image-cache"
import { startPeriodicCleanup } from "@/lib/cache-cleanup"

let cleanupInitialized = false

const CACHE_NAME = "plot-images"
let globalCachePromise: Promise<Cache> | null = null

function getPlotImageCache() {
  if (!globalCachePromise) {
    globalCachePromise = caches.open(CACHE_NAME)
  }
  return globalCachePromise
}

export function useImageCache(
  src: string | undefined,
  noCache = false
): { cachedSrc: string | undefined } {
  const [cacheTick, setCacheTick] = useState(0)
  const [asyncKey, setAsyncKey] = useState(() => `${src}|${noCache}`)
  const [asyncObjectUrl, setAsyncObjectUrl] = useState<string | undefined>()

  const newKey = `${src}|${noCache}|${cacheTick}`
  if (newKey !== asyncKey) {
    setAsyncKey(newKey)
    setAsyncObjectUrl(undefined)
  }

  const syncCachedSrc = !src || noCache ? src : memoryCache.get(src) || src
  const cachedSrc = asyncObjectUrl ?? syncCachedSrc

  useEffect(() => {
    return subscribeToCacheClear(() => setCacheTick((t) => t + 1))
  }, [])

  useEffect(() => {
    if (!cleanupInitialized) {
      cleanupInitialized = true
      startPeriodicCleanup()
    }
  }, [])

  useEffect(() => {
    if (!src || noCache) return

    if (memoryCache.has(src)) {
      cacheManager.recordAccess(src).catch(() => {})
      return
    }

    let isMounted = true

    async function load() {
      if (fetchPromises.has(src!)) {
        try {
          const objectUrl = await fetchPromises.get(src!)
          if (isMounted && objectUrl) setAsyncObjectUrl(objectUrl)
        } catch {
          // fallback to sync src
        }
        return
      }

      const promise = (async () => {
        const cache = await getPlotImageCache()
        let res = await cache.match(src!)
        if (!res) {
          res = await fetch(src!)
          if (res.ok) {
            cache.put(src!, res.clone())
          }
        }
        if (res.ok) {
          const blob = await res.blob()
          const objectUrl = URL.createObjectURL(blob)
          memoryCache.set(src!, objectUrl)
          return objectUrl
        }
        throw new Error("Failed to load")
      })()

      fetchPromises.set(src!, promise)

      try {
        const objectUrl = await promise
        if (isMounted) {
          setAsyncObjectUrl(objectUrl)
          cacheManager.recordAccess(src!).catch(() => {})
        }
      } catch {
        // fallback to sync src
      } finally {
        fetchPromises.delete(src!)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [src, noCache, cacheTick])

  return { cachedSrc }
}
