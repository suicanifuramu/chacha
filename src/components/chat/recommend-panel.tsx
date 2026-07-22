import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { RecommendCard } from "./recommend-card"
import type { RecommendQuotaResponse } from "@/lib/types"

interface RecommendPanelProps {
  recVisible: boolean
  recItems: Array<{ text?: string; content?: string; message?: string }>
  recPage: number
  recLoading: boolean
  recQuota: RecommendQuotaResponse | null
  onPageChange: (page: number) => void
  onLoadRecommendations: (refresh?: boolean) => void
  onSelectItem: (text: string) => void
}

function getRecText(item: { text?: string; content?: string; message?: string }) {
  return item?.text || item?.content || item?.message || ""
}

export function RecommendPanel({
  recVisible,
  recItems,
  recPage,
  recLoading,
  recQuota,
  onPageChange,
  onLoadRecommendations,
  onSelectItem,
}: RecommendPanelProps) {
  if (!recVisible) return null

  const pageItems = recItems.slice(recPage * 3, recPage * 3 + 3)
  const maxPage = Math.max(0, Math.ceil(recItems.length / 3) - 1)

  return (
    <div className="border-t border-border bg-card/80 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium">推薦文</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {recQuota
            ? `${recQuota.remaining ?? "-"}/${recQuota.max ?? "-"}`
            : ""}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {recLoading ? (
          <div className="flex items-center justify-center py-3">
            <Spinner className="size-4" />
            <span className="ml-2 text-xs text-muted-foreground">
              取得中…
            </span>
          </div>
        ) : pageItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            推薦文がありません
          </p>
        ) : (
          pageItems.map((item, i) => (
            <RecommendCard
              key={`${recPage}-${i}`}
              text={getRecText(item)}
              onClick={() => onSelectItem(getRecText(item))}
            />
          ))
        )}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={recPage <= 0}
          onClick={() => onPageChange(Math.max(0, recPage - 1))}
          aria-label="前の推薦文"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-8 text-center text-xs text-muted-foreground tabular-nums">
          {recItems.length > 0
            ? `${recPage + 1}/${Math.ceil(recItems.length / 3)}`
            : "-"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={recLoading}
          onClick={() => {
            if (recPage >= maxPage) {
              onLoadRecommendations(true)
              onPageChange(maxPage + 1)
            } else {
              onPageChange(recPage + 1)
            }
          }}
          aria-label="次の推薦文"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
