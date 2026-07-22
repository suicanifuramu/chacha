import { useEffect, useState, useRef, useCallback } from "react"
import { MessageCircle, ScrollText, Users } from "lucide-react"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import type { Plot, Bot, Character } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CachedAvatarImage } from "@/components/cached-avatar-image"
import { CachedImage } from "@/components/cached-image"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { getPlot, proxyImage } from "@/lib/api"
import { renderContentItem } from "@/lib/info-box"
import { PlotStatusBar } from "@/components/plot-status-bar"
import { parseBotContents } from "@/hooks/use-chat-messages"
import { replaceUserVars } from "@/lib/user-vars"

interface PlotDetailDialogProps {
  plot: Plot | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartChat?: (plot: Plot) => void
}

export function PlotDetailDialog({
  plot,
  open,
  onOpenChange,
  onStartChat,
}: PlotDetailDialogProps) {
  const [detail, setDetail] = useState<Bot | null>(null)
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!open || !plot?.id) return
    const loadPlot = async () => {
      setLoading(true)
      try {
        const data = await getPlot(plot.id)
        setDetail(data as Bot)
      } catch (e: unknown) {
        toast.error(
          `プロット取得失敗: ${e instanceof Error ? e.message : String(e)}`
        )
        setDetail(null)
      } finally {
        setLoading(false)
      }
    }
    loadPlot()
  }, [open, plot?.id])

  const d = detail || (plot as unknown as Bot | null) || null
  const heroImg = proxyImage(d?.thumbnailImage?.url || plot?.imageUrl) || ""
  const rawName = d?.name || plot?.name || ""
  const plotName = rawName ? replaceUserVars(rawName) : "タイトルなし"
  const description = replaceUserVars(d?.description || "")
  const characters: Character[] = (d?.characters || []).map((c) => ({
    id: c.publicId,
    name: c.name,
    imageUrl: proxyImage(c.thumbnailImage?.url),
    description: replaceUserVars(c.persona || c.description || ""),
    persona: c.persona,
  }))

  // Avatar lookup keyed by character name — same as the chat screen so the
  // intro bubbles render character avatars identically to in-chat messages.
  const charAvatars: Record<string, string> = {}
  for (const c of characters) {
    if (c.name && c.imageUrl) charAvatars[c.name] = c.imageUrl
  }
  const tags: string[] = (d?.tags || []).map((t) => t.name)
  const interactionCount = 0

  const handleStart = async () => {
    setStarting(true)
    try {
      if (onStartChat) await onStartChat(plot!)
    } finally {
      setStarting(false)
    }
  }

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [showPlotImage, setShowPlotImage] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const toggleImage = useCallback(() => {
    if (showPlotImage && isDesktop) {
      heroRef.current?.scrollIntoView({ behavior: "instant", block: "start" })
    }
    setShowPlotImage((prev) => !prev)
  }, [showPlotImage, isDesktop])

  const content = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`touch-scrollable min-h-0 overflow-y-auto overscroll-contain ${isDesktop ? "flex-1" : "max-h-[85vh]"}`}>
        {/* Hero image */}
        {heroImg ? (
          <div
            ref={heroRef}
            className={`relative w-full cursor-pointer ${showPlotImage ? "" : "h-52 overflow-hidden sm:h-64"}`}
            onClick={toggleImage}
          >
            <CachedImage
              src={heroImg}
              alt={plotName}
              className={
                showPlotImage
                  ? "h-auto w-full max-w-none"
                  : "size-full object-cover"
              }
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute right-4 bottom-3 left-4">
              <h2 className="line-clamp-2 text-lg leading-tight font-bold text-white drop-shadow-lg">
                {plotName}
              </h2>
              {d?.user?.displayName && (
                <p className="mt-0.5 text-sm text-white/80 drop-shadow">
                  {d.user.displayName}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-5 pt-5 pb-2">
            <h2 className="line-clamp-2 text-lg leading-tight font-bold">
              {plotName}
            </h2>
            {d?.user?.displayName && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {d.user.displayName}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 px-5 py-4">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((label, i) => (
                <Badge key={i} variant="secondary" className="text-[11px]">
                  #{label}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {loading ? (
            <div className="flex flex-col gap-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
            </div>
          ) : description ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
              {description}
            </p>
          ) : null}

          {/* Characters section */}
          {characters.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Users className="size-3.5" /> キャラクター
                </h3>
                <div className="flex flex-col gap-2">
                  {characters.map((char) => {
                    const charKey = `char-${char.id || char.name}`
                    const isExpanded = expandedIds.has(charKey)
                    return (
                      <div
                        key={char.id || char.name}
                        className="flex cursor-pointer items-start gap-3 rounded-lg bg-secondary/30 px-3 py-2"
                        onClick={() => char.description && toggleExpand(charKey)}
                      >
                        <Avatar className="mt-0.5 size-9 shrink-0">
                          <CachedAvatarImage src={char.imageUrl} />
                          <AvatarFallback>
                            {(char.name || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {char.name}
                          </p>
                          {char.description && (
                            <p
                              className={`mt-0.5 text-xs whitespace-pre-wrap text-muted-foreground ${isExpanded ? "" : "line-clamp-2"}`}
                            >
                              {char.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Intro (rendered as message bubbles) */}
          {d?.firstMessage ? (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ScrollText className="size-3.5" /> イントロ
              </h3>
              <div className="flex flex-col gap-2">
                {parseBotContents(replaceUserVars(d.firstMessage)).map((item, i) =>
                  renderContentItem(item, "intro-", i, {
                    charAvatars,
                    deleteMode: false,
                    streaming: false,
                    onUserMessageTap: () => {},
                    onAvatarTap: () => {},
                    streamMode: false,
                  })
                )}
              </div>
            </div>
          ) : null}

          {/* Statuses */}
          {d?.statuses && d.statuses.length > 0 && (
            <PlotStatusBar
              statuses={d.statuses
                .filter((s) => s.label)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((s) => ({ label: s.label, value: s.defaultValue ?? "" }))}
            />
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-5 py-3">
        {isDesktop && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            閉じる
          </Button>
        )}
        {onStartChat && (
          <Button
            size="sm"
            onClick={handleStart}
            disabled={starting || loading}
          >
            {starting && <Spinner className="mr-1 size-3" />}
            <MessageCircle className="mr-1 size-4" />
            チャット開始
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="ストーリー詳細"
      desktopClassName="max-h-[85vh] max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg flex flex-col"
      mobileClassName="max-h-[85vh] gap-0 overflow-hidden p-0"
    >
      {content}
    </ResponsiveDialog>
  )
}
