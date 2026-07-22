import { ScrollText } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusItem {
  label: string
  value: string
}

interface PlotStatusBarProps {
  statuses: StatusItem[]
  className?: string
}

export function PlotStatusBar({ statuses, className }: PlotStatusBarProps) {
  if (statuses.length === 0) return null

  return (
    <div
      className={cn(
        "rounded-lg border bg-secondary/20 px-3.5 py-3",
        className
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ScrollText className="size-3.5" />
        ステータス
      </div>
      <div className="divide-y divide-border/50">
        {statuses.map((s, i) => (
          <div
            key={i}
            className="flex items-baseline gap-3 py-1.5 first:pt-0 last:pb-0"
          >
            <span className="shrink-0 text-xs text-muted-foreground">
              {s.label}
            </span>
            <span className="flex-1 text-right text-sm leading-snug">
              {s.value || "\u00A0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
