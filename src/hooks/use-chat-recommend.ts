import { useState, useCallback } from "react"
import { toast } from "sonner"
import { getSmartReplyQuota, getSmartReply } from "@/lib/api"
import type { SmartReplyQuotaResponse } from "@/lib/types"

export type RecItem = { text?: string; content?: string; message?: string }

export function useChatRecommend(roomId: string | undefined) {
  const [recItems, setRecItems] = useState<RecItem[]>([])
  const [recVisible, setRecVisible] = useState(false)
  const [recQuota, setRecQuota] = useState<SmartReplyQuotaResponse | null>(null)
  const [recPage, setRecPage] = useState(0)
  const [recLoading, setRecLoading] = useState(false)

  async function loadRecommendations() {
    if (!roomId) return
    setRecLoading(true)
    try {
      const quotaData = await getSmartReplyQuota()
      setRecQuota(quotaData)
      if (quotaData.remaining <= 0) {
        setRecItems([])
        return
      }
      const data = await getSmartReply(roomId)
      const items: RecItem[] = (data.replies || []).map((r) => ({
        text: r.text,
      }))
      setRecItems(items)
      setRecPage(0)
    } catch (e: unknown) {
      toast.error(
        `推薦取得失敗: ${e instanceof Error ? e.message : String(e)}`
      )
    } finally {
      setRecLoading(false)
    }
  }

  const getRecText = useCallback((item: RecItem) => {
    return item?.text || item?.content || item?.message || ""
  }, [])

  const clearRecItems = useCallback(() => {
    setRecItems([])
    setRecPage(0)
  }, [])

  const pageItems = recItems.slice(recPage * 3, recPage * 3 + 3)

  return {
    recItems,
    recVisible,
    setRecVisible,
    recQuota,
    recPage,
    setRecPage,
    recLoading,
    loadRecommendations,
    getRecText,
    clearRecItems,
    pageItems,
  }
}
