import { memoryCache, fetchPromises } from "@/lib/image-cache"

interface PreloadOptions {
  concurrency?: number
  priority?: "high" | "low" | "auto"
  signal?: AbortSignal
  /**
   * Scheduling strategy:
   *   "concurrent" (default) — fire `concurrency` fetches in parallel.
   *   "idle"                  — process images one-at-a-time inside
   *                             requestIdleCallback ticks, yielding back to
   *                             the browser whenever the idle deadline drops
   *                             below `idleMinTimeRemainingMs`.
   */
  scheduling?: "concurrent" | "idle"
  /** Max wait (ms) before the browser forces an idle callback to fire. */
  idleTimeoutMs?: number
  /** Within an idle tick, yield if `deadline.timeRemaining()` drops below this. */
  idleMinTimeRemainingMs?: number
}

async function getPlotImageCache(): Promise<Cache> {
  return caches.open("plot-images")
}

async function preloadSingle(
  url: string,
  priority: RequestPriority
): Promise<string> {
  if (fetchPromises.has(url)) {
    const existingPromise = fetchPromises.get(url)
    if (existingPromise) {
      try {
        return await existingPromise
      } catch {
        // Ignore - already handled
      }
    }
  }

  if (memoryCache.has(url)) {
    const cached = memoryCache.get(url)
    if (cached) return cached
  }

  const promise = (async (): Promise<string> => {
    const cache = await getPlotImageCache()
    let res = await cache.match(url)
    if (!res) {
      res = await fetch(url, { priority })
      if (res.ok) {
        cache.put(url, res.clone())
      }
    }
    if (res.ok) {
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      memoryCache.set(url, objectUrl)
      return objectUrl
    }
    throw new Error(`Failed to load: ${res.status}`)
  })()

  fetchPromises.set(url, promise)

  try {
    return await promise
  } finally {
    fetchPromises.delete(url)
  }
}

// Process images serially under requestIdleCallback so the main thread stays
// responsive. Yields back to the browser whenever the idle deadline drops
// below `minTimeRemainingMs`; reschedules via a fresh idle callback (or
// setTimeout(50ms) on Safari, which lacks requestIdleCallback).
async function dispatchIdleBatch(
  urls: string[],
  priority: RequestPriority,
  options: {
    timeoutMs?: number
    minTimeRemainingMs?: number
    signal?: AbortSignal
  } = {}
): Promise<{ success: string[]; failed: string[] }> {
  const {
    timeoutMs = 2000,
    minTimeRemainingMs = 4,
    signal,
  } = options
  const success: string[] = []
  const failed: string[] = []
  const queue = [...urls]

  const ric = (
    globalThis as Window & typeof globalThis
  ).requestIdleCallback?.bind(globalThis)

  return new Promise((resolve) => {
    const tick = (deadline: IdleDeadline | undefined) => {
      if (signal?.aborted || queue.length === 0) {
        resolve({ success, failed })
        return
      }

      void (async () => {
        while (queue.length > 0 && !signal?.aborted) {
          if (
            deadline !== undefined &&
            deadline.timeRemaining() < minTimeRemainingMs
          ) {
            break
          }
          const url = queue.shift()!
          try {
            await preloadSingle(url, priority)
            success.push(url)
          } catch {
            failed.push(url)
          }
        }

        if (signal?.aborted || queue.length === 0) {
          resolve({ success, failed })
          return
        }

        if (ric) {
          ric(tick, { timeout: timeoutMs })
        } else {
          setTimeout(() => tick(undefined), 50)
        }
      })()
    }

    if (ric) {
      ric(tick, { timeout: timeoutMs })
    } else {
      setTimeout(() => tick(undefined), 0)
    }
  })
}

export async function preloadImages(
  urls: string[],
  options: PreloadOptions = {}
): Promise<{ success: string[]; failed: string[] }> {
  const {
    concurrency = 6,
    priority = "low",
    signal,
    scheduling = "concurrent",
    idleTimeoutMs = 2000,
    idleMinTimeRemainingMs = 4,
  } = options

  const uncachedUrls = urls.filter((url) => url && !memoryCache.has(url))

  if (uncachedUrls.length === 0) {
    return { success: urls.filter(Boolean), failed: [] }
  }

  if (scheduling === "idle") {
    return dispatchIdleBatch(uncachedUrls, priority, {
      timeoutMs: idleTimeoutMs,
      minTimeRemainingMs: idleMinTimeRemainingMs,
      signal,
    })
  }

  const success: string[] = []
  const failed: string[] = []
  const queue = [...uncachedUrls]
  const running = new Set<Promise<void>>()

  async function processNext(): Promise<void> {
    if (queue.length === 0 || signal?.aborted) return

    const url = queue.shift()!

    const promise = (async () => {
      try {
        await preloadSingle(url, priority)
        success.push(url)
      } catch {
        failed.push(url)
      }
    })()

    running.add(promise)
    promise.finally(() => {
      running.delete(promise)
      processNext()
    })

    await promise
  }

  const initialBatch = Math.min(concurrency, queue.length)
  await Promise.all(Array.from({ length: initialBatch }, () => processNext()))

  await Promise.all(running)

  const allSuccess = [...urls.filter((u) => memoryCache.has(u)), ...success]
  return { success: allSuccess, failed }
}

export function preloadImagesAsync(
  urls: string[],
  options?: PreloadOptions
): void {
  preloadImages(urls, options).catch((e) => {
    if (e instanceof DOMException && e.name === "AbortError") return
    console.warn("[image-preloader]", e)
  })
}
