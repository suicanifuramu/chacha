import { memo } from "react"

export const RecommendCard = memo(function RecommendCard({
  text,
  onClick,
}: {
  text: string
  onClick: () => void
}) {
  return (
    <button
      className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2.5 text-left text-xs leading-relaxed transition-colors hover:border-primary/30 hover:bg-secondary"
      onClick={onClick}
    >
      {text}
    </button>
  )
})
