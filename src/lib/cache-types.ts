export interface CacheAccessRecord {
  url: string
  lastAccess: number
  cachedAt: number
  accessCount: number
}

export interface CleanupResult {
  scanned: number
  deleted: number
  errors: string[]
  durationMs: number
}

export interface CacheManager {
  recordAccess(url: string): Promise<void>
  getExpiredUrls(maxAgeMs: number): Promise<string[]>
  deleteUrls(urls: string[]): Promise<void>
  runCleanup(maxAgeMs: number): Promise<CleanupResult>
}
