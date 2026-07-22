import { useRef, useMemo, memo, useEffect } from "react"
import { ArrowDown, ChevronLeft, ChevronRight, Pencil, RefreshCw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { StreamingDots } from "./streaming-dots"
import { cn } from "@/lib/utils"
import { renderContentItem } from "@/lib/info-box"
import { parseBotContents } from "@/hooks/use-chat-messages"
import { replaceUserVars } from "@/lib/user-vars"
import type {
  RuntimeMessage,
  ContentItem,
  Candidate,
} from "@/lib/types"

interface MessageListProps {
  scrollRef: React.RefObject<HTMLDivElement | null>
  topSentinelRef: React.RefObject<HTMLDivElement | null>
  messages: RuntimeMessage[]
  loading: boolean
  loadingHistory: boolean
  hasMoreHistory: boolean
  deleteMode: boolean
  selectedMsgId: string | null
  regenMsgId: string | null
  regenContents: ContentItem[] | null
  streamContents: ContentItem[] | null
  charAvatars: Record<string, string>
  candidatesCache: Record<string, { candidates: Candidate[]; currentIdx: number }>
  lastSwipeDirection: {
    id: string
    direction: "prev" | "next" | "regen" | null
    key: number
  }
  showScrollBottom: boolean
  streaming: boolean
  onSmoothScrollToBottom: () => void
  onAvatarTap: (characterName: string) => void
  onUserMessageTap: () => void
  onRegen: (msgId: string) => void
  onSwitchCandidate: (msgId: string, direction: "prev" | "next") => Promise<boolean>
  onEditMessage: (msgId: string, candidateId: string, text: string) => void
  onSelectMsgForDelete: (msgId: string) => void
  introContent?: string | null
  profileSheetOpen?: boolean
}

export const MessageList = memo(function MessageList({
  scrollRef,
  topSentinelRef,
  messages,
  loading,
  loadingHistory,
  hasMoreHistory,
  deleteMode,
  selectedMsgId,
  regenMsgId,
  regenContents,
  streamContents,
  charAvatars,
  candidatesCache,
  lastSwipeDirection,
  showScrollBottom,
  streaming,
  onSmoothScrollToBottom,
  onAvatarTap,
  onUserMessageTap,
  onRegen,
  onSwitchCandidate,
  onEditMessage,
  onSelectMsgForDelete,
  introContent,
  profileSheetOpen,
}: MessageListProps) {
  const touchStateRef = useRef<{
    x: number
    y: number
    isScrolling: boolean
    isSwiping: boolean
  } | null>(null)

  const prevSheetOpen = useRef(profileSheetOpen)
  useEffect(() => {
    if (!introContent || messages.length > 0) return
    const doScroll = () => {
      const viewport = scrollRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement | null
      if (viewport) viewport.scrollTop = viewport.scrollHeight
    }
    requestAnimationFrame(() => {
      doScroll()
      setTimeout(doScroll, 100)
      setTimeout(doScroll, 300)
    })
  }, [introContent, messages.length, scrollRef])

  useEffect(() => {
    if (prevSheetOpen.current && !profileSheetOpen && introContent && messages.length === 0) {
      const doScroll = () => {
        const viewport = scrollRef.current?.querySelector(
          "[data-radix-scroll-area-viewport]"
        ) as HTMLElement | null
        if (viewport) viewport.scrollTop = viewport.scrollHeight
      }
      requestAnimationFrame(() => {
        doScroll()
        setTimeout(doScroll, 100)
        setTimeout(doScroll, 300)
      })
    }
    prevSheetOpen.current = profileSheetOpen
  }, [profileSheetOpen, introContent, messages.length, scrollRef])

  const renderedMessages = useMemo(() => {
    const runtimeMsgs = messages
    const lastBotMsgId =
      [...runtimeMsgs]
        .reverse()
        .find((m) => m.sender?.type === "BOT" && !m.isIntro)?.id || null

    const selectedIdx =
      deleteMode && selectedMsgId
        ? runtimeMsgs.findIndex((m) => m.id === selectedMsgId)
        : -1

    return runtimeMsgs.map((msg, msgIdx) => {
      const isIntro = !!msg.isIntro
      const isLastBot = msg.id === lastBotMsgId
      const isSelected = deleteMode && selectedMsgId === msg.id
      const isAfterSelected =
        deleteMode && selectedIdx !== -1 && msgIdx > selectedIdx
      const isMarked = isSelected || isAfterSelected
      const isRegening = regenMsgId === msg.id

      const nextMsg = runtimeMsgs[msgIdx + 1]
      const nextIsMarked =
        deleteMode &&
        selectedIdx !== -1 &&
        nextMsg &&
        runtimeMsgs.indexOf(nextMsg) >= selectedIdx
      const prevMsg = runtimeMsgs[msgIdx - 1]
      const prevIsMarked =
        deleteMode &&
        selectedIdx !== -1 &&
        prevMsg &&
        runtimeMsgs.indexOf(prevMsg) >= selectedIdx

      const handleTouchStart = (e: React.TouchEvent) => {
        if (!deleteMode && isLastBot && !isIntro) {
          const el = document.getElementById(`msg-swipe-${msg.id}`)
          if (el) el.style.transition = "none"
          touchStateRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            isScrolling: false,
            isSwiping: false,
          }
        }
      }

      const handleTouchMove = (e: React.TouchEvent) => {
        if (!deleteMode && isLastBot && !isIntro && touchStateRef.current) {
          const state = touchStateRef.current
          const diffX = e.touches[0].clientX - state.x
          const diffY = e.touches[0].clientY - state.y

          if (!state.isSwiping && !state.isScrolling) {
            if (Math.abs(diffY) > 10) {
              state.isScrolling = true
            } else if (Math.abs(diffX) > 10) {
              state.isSwiping = true
            }
          }

          if (state.isSwiping) {
            const el = document.getElementById(`msg-swipe-${msg.id}`)
            if (el) {
              el.style.transform = `translateX(${diffX}px)`
            }
          }
        }
      }

      const handleTouchEnd = async (e: React.TouchEvent) => {
        if (!deleteMode && isLastBot && !isIntro && touchStateRef.current) {
          const state = touchStateRef.current
          const el = document.getElementById(`msg-swipe-${msg.id}`)
          if (state.isSwiping && !state.isScrolling) {
            const diffX = e.changedTouches[0].clientX - state.x
            if (Math.abs(diffX) > 50) {
              if (el) {
                el.style.transition = "transform 0.3s ease-out"
                el.style.transform = `translateX(${diffX > 0 ? 100 : -100}vw)`
              }
              const success = await onSwitchCandidate(
                msg.id,
                diffX > 0 ? "prev" : "next"
              )
              if (!success && el) {
                el.style.transition = "transform 0.3s ease-out"
                el.style.transform = "translateX(0px)"
              }
            } else {
              if (el) {
                el.style.transition = "transform 0.2s ease-out"
                el.style.transform = "translateX(0px)"
              }
            }
          } else {
            if (el) {
              el.style.transition = "transform 0.2s ease-out"
              el.style.transform = "translateX(0px)"
            }
          }
          touchStateRef.current = null
        }
      }

      const handleTouchCancel = () => {
        if (touchStateRef.current) touchStateRef.current = null
        const el = document.getElementById(`msg-swipe-${msg.id}`)
        if (el) {
          el.style.transition = "transform 0.2s ease-out"
          el.style.transform = "translateX(0px)"
        }
      }

      return (
        <div
          key={msg.id}
          id={`msg-swipe-${msg.id}`}
          style={{ touchAction: "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          className={cn(
            deleteMode &&
              !isIntro &&
              "-mx-2 cursor-pointer border-2 px-2 py-1 transition-colors",
            deleteMode &&
              isIntro &&
              "-mx-2 cursor-not-allowed px-2 py-1 opacity-40",
            deleteMode &&
              !isMarked &&
              !isIntro &&
              "rounded-lg border-transparent hover:bg-destructive/10",
            isMarked &&
              "border-r-destructive border-l-destructive bg-destructive/20",
            isMarked &&
              (prevIsMarked
                ? "border-t-transparent"
                : "rounded-t-lg border-t-destructive"),
            isMarked &&
              (nextIsMarked
                ? "border-b-transparent"
                : "rounded-b-lg border-b-destructive")
          )}
          onClick={() => {
            if (deleteMode && !isIntro) onSelectMsgForDelete(msg.id)
          }}
        >
          {/* Show inline regen streaming instead of original content */}
          {isRegening && regenContents && regenContents.length > 0 ? (
            regenContents.map((c, ci) =>
              renderContentItem(c, "regen-", ci, {
                charAvatars,
                deleteMode,
                streaming,
                onUserMessageTap,
                onAvatarTap,
                streamMode: true,
              })
            )
          ) : isRegening ? (
            <StreamingDots />
          ) : (
            <div
              key={`${msg.id}-${lastSwipeDirection.id === msg.id ? lastSwipeDirection.key : msg.candidateId || 0}`}
              className={cn(
                "animate-in duration-300",
                lastSwipeDirection.id === msg.id &&
                  lastSwipeDirection.direction === "next"
                  ? "fade-in slide-in-from-right-full"
                  : "",
                lastSwipeDirection.id === msg.id &&
                  lastSwipeDirection.direction === "prev"
                  ? "fade-in slide-in-from-left-full"
                  : "",
                lastSwipeDirection.id !== msg.id ||
                  lastSwipeDirection.direction === "regen"
                  ? "zoom-in-95 fade-in"
                  : ""
              )}
            >
              {(msg.contents || []).map((c, ci) =>
                renderContentItem(c, "", ci, {
                  charAvatars,
                  deleteMode,
                  streaming,
                  onUserMessageTap,
                  onAvatarTap,
                  streamMode: false,
                })
              )}
            </div>
          )}
          {/* BOT message controls: regen + candidate nav + edit (last BOT message only) */}
          {!deleteMode &&
            isLastBot &&
            !isIntro &&
            !isRegening &&
            (() => {
              const cache = candidatesCache[msg.id]
              const candCount = cache?.candidates?.length || 0
              const candIdx = cache?.currentIdx ?? -1
              return (
                <div className="mb-2 ml-10 flex flex-wrap items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => onRegen(msg.id)}
                    aria-label="再生成"
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => onSwitchCandidate(msg.id, "prev")}
                    aria-label="前の候補"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  {candCount > 1 && (
                    <span className="min-w-6 text-center text-[10px] text-muted-foreground tabular-nums select-none">
                      {candIdx + 1}/{candCount}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => onSwitchCandidate(msg.id, "next")}
                    aria-label="次の候補"
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => {
                      const txt =
                        msg.contents
                          ?.map((c) => {
                            if (c.speakerName) {
                              return `@${c.speakerName}: ${(c.text || "").trim()}`
                            }
                            return `@: ${(c.text || "").trim()}`
                          })
                          .join("\n\n") || ""
                      onEditMessage(msg.id, msg.candidateId || "", txt)
                    }}
                    aria-label="編集"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              )
            })()}
        </div>
      )
    })
  }, [
    messages,
    deleteMode,
    streaming,
    selectedMsgId,
    regenMsgId,
    regenContents,
    charAvatars,
    candidatesCache,
    lastSwipeDirection,
    onAvatarTap,
    onUserMessageTap,
    onRegen,
    onSwitchCandidate,
    onEditMessage,
    onSelectMsgForDelete,
  ])

  return (
    <>
      <ScrollArea ref={scrollRef} className="min-h-0 flex-1">
        {loading ? (
          <div className="flex flex-col gap-3 px-4 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  i % 2 === 1 ? "flex-row-reverse" : ""
                )}
              >
                <Skeleton className="size-8 rounded-full" />
                <Skeleton
                  className={cn(
                    "h-12 rounded-2xl",
                    i % 2 === 1 ? "w-1/3" : "w-2/3"
                  )}
                />
              </div>
            ))}
          </div>
        ) : (
          <div aria-live="polite" className="min-w-0 overflow-x-hidden px-4 py-3">
            {/* Top sentinel for loading older messages */}
            <div ref={topSentinelRef} className="flex justify-center py-2">
              {loadingHistory && <Spinner className="size-5" />}
              {!hasMoreHistory && messages.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  最初のメッセージです
                </p>
              )}
            </div>
            {messages.length === 0 && introContent ? (
              <div className="flex flex-col gap-2">
                {parseBotContents(replaceUserVars(introContent)).map((item, i) =>
                  renderContentItem(item, "intro-", i, {
                    charAvatars,
                    deleteMode: false,
                    streaming: false,
                    onUserMessageTap: () => {},
                    onAvatarTap,
                    streamMode: false,
                  })
                )}
              </div>
            ) : null}
            {renderedMessages}
            {streamContents !== null &&
              (streamContents.length === 0 ? (
                <StreamingDots />
              ) : (
                streamContents.map((c, ci) =>
                  renderContentItem(c, "stream-", ci, {
                    charAvatars,
                    deleteMode,
                    streaming,
                    onUserMessageTap,
                    onAvatarTap,
                    streamMode: true,
                  })
                )
              ))}
          </div>
        )}
      </ScrollArea>

      {/* Scroll to bottom button */}
      <div className="pointer-events-none relative h-0 w-full">
        {showScrollBottom && (
          <Button
            variant="secondary"
            size="icon"
            className="pointer-events-auto absolute right-4 bottom-4 z-30 animate-in rounded-full border border-border opacity-90 shadow-md duration-200 fade-in zoom-in hover:opacity-100"
            onClick={onSmoothScrollToBottom}
            aria-label="最下部へ"
          >
            <ArrowDown className="size-5" />
          </Button>
        )}
      </div>
    </>
  )
})
