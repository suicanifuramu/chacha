import { useEffect, useState } from "react"
import { toast } from "sonner"
import { clearAllCache } from "@/lib/cache-cleanup"

export function useSettingsCache() {
  const [cacheCount, setCacheCount] = useState(0)
  const [cacheDeleting, setCacheDeleting] = useState(false)

  useEffect(() => {
    caches
      .open("plot-images")
      .then((c) => c.keys().then((k) => setCacheCount(k.length)))
      .catch(() => {})
  }, [])

  const clearCache = async () => {
    setCacheDeleting(true)
    try {
      const { deletedCount } = await clearAllCache()
      setCacheCount(0)
      toast.success(`${deletedCount} 件のキャッシュを削除しました`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e))
    } finally {
      setCacheDeleting(false)
    }
  }

  return { cacheCount, cacheDeleting, clearCache }
}
