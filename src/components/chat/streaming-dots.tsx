import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function StreamingDots() {
  return (
    <div
      className="my-1 flex items-center gap-2"
      role="status"
      aria-label="メッセージを生成中"
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback>…</AvatarFallback>
      </Avatar>
      <div className="flex gap-1.5 rounded-2xl bg-secondary px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block size-2 rounded-full bg-muted-foreground"
            style={{ animation: `dot-pulse 1.2s infinite ${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
