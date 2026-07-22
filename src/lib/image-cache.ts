const MAX_SIZE = 100
const _map = new Map<string, string>()
const _fetchPromises = new Map<string, Promise<string>>()
const _clearListeners = new Set<() => void>()

export function subscribeToCacheClear(listener: () => void): () => void {
  _clearListeners.add(listener)
  return () => _clearListeners.delete(listener)
}

function evictIfNeeded(): void {
  if (_map.size < MAX_SIZE) return
  const firstKey = _map.keys().next()
  if (!firstKey.done) {
    const url = firstKey.value
    URL.revokeObjectURL(_map.get(url)!)
    _map.delete(url)
  }
}

export function clearMemoryCache(): number {
  let count = 0
  for (const objectUrl of _map.values()) {
    URL.revokeObjectURL(objectUrl)
    count++
  }
  _map.clear()
  _fetchPromises.clear()
  _clearListeners.forEach((fn) => fn())
  return count
}

export const memoryCache = {
  has(url: string): boolean {
    return _map.has(url)
  },
  get(url: string): string | undefined {
    return _map.get(url)
  },
  set(url: string, objectUrl: string): void {
    if (!_map.has(url)) evictIfNeeded()
    _map.set(url, objectUrl)
  },
  delete(url: string): void {
    _map.delete(url)
  },
  clear(): void {
    _map.clear()
  },
  get size(): number {
    return _map.size
  },
}

export const fetchPromises = {
  has(url: string): boolean {
    return _fetchPromises.has(url)
  },
  get(url: string): Promise<string> | undefined {
    return _fetchPromises.get(url)
  },
  set(url: string, promise: Promise<string>): void {
    _fetchPromises.set(url, promise)
  },
  delete(url: string): void {
    _fetchPromises.delete(url)
  },
  clear(): void {
    _fetchPromises.clear()
  },
}
