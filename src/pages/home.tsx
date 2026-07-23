import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { PlotCard } from "@/components/plot-card"
import { PlotDetailDialog } from "@/components/plot-detail-dialog"
import { useHomePlots } from "@/hooks/use-home-plots"
import { usePlotNavigation } from "@/hooks/use-plot-navigation"

export function HomePage() {
  useEffect(() => {
    document.title = "おすすめ - Chacha Chat"
  }, [])

  const { plots, loading, loadingMore, hasMore, sentinelRef, loadPlots } =
    useHomePlots()
  const {
    dialogPlot,
    dialogOpen,
    setDialogOpen,
    handlePlotClick,
    handleStartChat,
  } = usePlotNavigation()

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between px-5 pt-[max(18px,env(safe-area-inset-top))] pb-3">
        <div>
          <h1 className="text-2xl font-bold text-wrap balance">おすすめ</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            loadPlots(true)
            toast.success("更新しました")
          }}
        >
          <RefreshCw className="mr-1 size-4" />
          更新
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
        ) : plots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
            <p>コンテンツがありません</p>
            <p className="text-xs">更新ボタンを押して再度お試しください</p>
          </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 px-5">
          {plots.map((plot, i) => (
            <div
              key={plot.id}
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
            >
              <PlotCard
                plot={plot}
                cached={false}
                onClick={() => handlePlotClick(plot)}
              />
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="flex justify-center py-4">
        {loadingMore && <Spinner className="size-6" />}
        {!hasMore && plots.length > 0 && (
          <p className="text-xs text-muted-foreground">すべて読み込みました</p>
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
