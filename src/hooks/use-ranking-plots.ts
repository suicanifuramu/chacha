import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { getDailyRanking, getWeeklyRanking, getMonthlyRanking, botToPlot } from "@/lib/api"
import { preloadImagesAsync } from "@/lib/image-preloader"
import type { Plot } from "@/lib/types"

const BATCH_SIZE = 20

export interface UseRankingPlotsReturn {
  tab: string
  setTab: (v: string) => void
  displayed: Plot[]
  loading: boolean
  hasMore: boolean
  sentinelRef: React.RefObject<HTMLDivElement | null>
  loadRanking: (type: string) => Promise<void>
}

export function useRankingPlots(): UseRankingPlotsReturn {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get("tab") || "daily")
  const [allItems, setAllItems] = useState<Plot[]>([])
  const [displayed, setDisplayed] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleSetTab = useCallback((v: string) => {
    setTab(v)
    setSearchParams({ tab: v })
  }, [setSearchParams])

  const loadRanking = useCallback(async (type: string) => {
    setLoading(true)
    setDisplayed([])
    setHasMore(true)
    try {
      const fetcher =
        type === "daily"
          ? getDailyRanking
          : type === "weekly"
            ? getWeeklyRanking
            : getMonthlyRanking
      const data = await fetcher(100)
      const bots = data.bots || []
      const items = bots.map(botToPlot)

      const imageUrls = items
        .map((p) => p.imageUrl)
        .filter((u): u is string => typeof u === "string")
      if (imageUrls.length > 0) {
        preloadImagesAsync(imageUrls, {
          priority: "low",
          scheduling: "idle",
        })
      }

      setAllItems(items)
      setDisplayed(items.slice(0, BATCH_SIZE))
      setHasMore(items.length > BATCH_SIZE)
    } catch (e: unknown) {
      toast.error(`読み込み失敗: ${e instanceof Error ? e.message : String(e)}`)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRanking(tab)
  }, [tab, loadRanking])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || loading) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) {
          setDisplayed((prev) => {
            const next = allItems.slice(0, prev.length + BATCH_SIZE)
            return next
          })
        }
      },
      { rootMargin: "300px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [allItems, hasMore, loading])

  useEffect(() => {
    if (displayed.length >= allItems.length && allItems.length > 0) {
      setHasMore(false)
    }
  }, [displayed, allItems])

  return {
    tab,
    setTab: handleSetTab,
    displayed,
    loading,
    hasMore,
    sentinelRef,
    loadRanking,
  }
}
