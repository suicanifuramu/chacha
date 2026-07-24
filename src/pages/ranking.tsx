import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { PlotCard } from "@/components/plot-card"
import { PlotDetailDialog } from "@/components/plot-detail-dialog"
import { useRankingPlots } from "@/hooks/use-ranking-plots"
import { usePlotNavigation } from "@/hooks/use-plot-navigation"
import { useEffect } from "react"

const TABS = [
  { value: "daily", label: "日間" },
  { value: "weekly", label: "週間" },
  { value: "monthly", label: "月間" },
] as const

export function RankingPage() {
  useEffect(() => {
    document.title = "Chacha Chat"
  }, [])

  const { tab, setTab, displayed, loading, hasMore, sentinelRef } =
    useRankingPlots()
  const {
    dialogPlot,
    dialogOpen,
    setDialogOpen,
    handlePlotClick,
    handleStartChat,
  } = usePlotNavigation()

  return (
    <div className="animate-fade-in">
      <header className="px-5 pt-[max(18px,env(safe-area-inset-top))] pb-1">
        <h1 className="text-2xl font-bold text-wrap balance">ランキング</h1>
      </header>

      <div className="px-5 py-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="flex-1">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
            <p>データがありません</p>
            <p className="text-xs">他の期間を選択してみてください</p>
          </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-5">
          {displayed.map((plot, i) => (
            <div
              key={plot.id}
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
            >
              <PlotCard plot={plot} onClick={() => handlePlotClick(plot)} />
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {hasMore && !loading && <Spinner className="size-6" />}
        {!hasMore && displayed.length > 0 && (
          <p className="text-xs text-muted-foreground">すべて表示しました</p>
        )}
      </div>

      <PlotDetailDialog
        plot={dialogPlot}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStartChat={handleStartChat}
      />
    </div>
  )
}
