import type { PlotStatus } from "@/lib/types"

interface ChatStatusBarProps {
  statuses: PlotStatus[]
}

export function ChatStatusBar({ statuses }: ChatStatusBarProps) {
  const items = statuses
    .filter((s) => s.label)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (items.length === 0) return null

  return (
    <div className="overflow-x-auto border-b border-border">
      <div className="flex items-center gap-2 px-3 py-1.5">
        {items.map((s) => (
          <span
            key={s.publicId}
            className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs text-foreground/70 whitespace-nowrap"
          >
            <span className="font-semibold">{s.label}</span>
            {s.defaultValue ? ` ${s.defaultValue}` : ""}
          </span>
        ))}
      </div>
    </div>
  )
}
