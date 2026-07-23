import { cacheManager, clearAllUrls } from "./cache-db"
import { clearMemoryCache } from "./image-cache"
import type { CleanupResult } from "./cache-types"
import { logger } from "./log"

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000

let cleanupTimer: ReturnType<typeof setInterval> | null = null
let isCleanupRunning = false

async function deleteFromCacheAPI(urls: string[]): Promise<string[]> {
  if (urls.length === 0) return []

  try {
    const cache = await caches.open("plot-images")
    const deleted: string[] = []

    for (const url of urls) {
      try {
        const result = await cache.delete(url)
        if (result) deleted.push(url)
      } catch {
        // Ignore individual failures
      }
    }

    return deleted
  } catch {
    return []
  }
}

export async function runCleanup(): Promise<CleanupResult> {
  if (isCleanupRunning) {
    logger.debug("[CacheCleanup] Already running, skipping")
    return {
      scanned: 0,
      deleted: 0,
      errors: ["Already running"],
      durationMs: 0,
    }
  }

  isCleanupRunning = true
  logger.debug("[CacheCleanup] Starting...")

  try {
    const expiredUrls = await cacheManager.getExpiredUrls(MAX_AGE_MS)

    if (expiredUrls.length === 0) {
      logger.debug("[CacheCleanup] No expired items")
      return { scanned: 0, deleted: 0, errors: [], durationMs: 0 }
    }

    await cacheManager.deleteUrls(expiredUrls)
    const cacheDeleted = await deleteFromCacheAPI(expiredUrls)

    const result: CleanupResult = {
      scanned: expiredUrls.length,
      deleted: cacheDeleted.length,
      errors: [],
      durationMs: 0,
    }

    logger.debug(`[CacheCleanup] Completed: deleted ${result.deleted} items`)
    return result
  } catch (e) {
    const errorMsg = String(e)
    console.warn("[CacheCleanup] Failed:", errorMsg)
    return { scanned: 0, deleted: 0, errors: [errorMsg], durationMs: 0 }
  } finally {
    isCleanupRunning = false
  }
}

export function startPeriodicCleanup(): () => void {
  cleanupTimer = setInterval(() => {
    runCleanup().catch((e) =>
      console.warn("[CacheCleanup] Periodic run failed:", e)
    )
  }, CLEANUP_INTERVAL_MS)

  return () => stopPeriodicCleanup()
}

export function stopPeriodicCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }
}

export async function clearAllCache(): Promise<{ deletedCount: number }> {
  const deletedCount = clearMemoryCache()

  try {
    await clearAllUrls()
  } catch (e) {
    console.warn("[CacheCleanup] IndexedDB clear failed:", e)
  }

  logger.debug(
    `[CacheCleanup] Memory cache cleared: ${deletedCount} items (Cache API kept intact)`
  )
  return { deletedCount }
}
