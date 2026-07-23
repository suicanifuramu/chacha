import { memo, type ReactNode } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CachedAvatarImage } from "@/components/cached-avatar-image"
import { cn } from "@/lib/utils"
import { useLongPress } from "@/hooks/use-long-press"
import type { ContentItem } from "@/lib/types"

function isWordChar(c: string | undefined): boolean {
  return c !== undefined && /[A-Za-z0-9]/.test(c)
}

function leftBoundary(text: string, i: number): boolean {
  if (i === 0) return true
  return !isWordChar(text[i - 1])
}

function rightBoundary(text: string, after: number): boolean {
  if (after >= text.length) return true
  return !isWordChar(text[after])
}

type EmNode = { type: "b" | "i" | "bi"; text: string; end: number }

function tryEmphasis(text: string, i: number): EmNode | null {
  if (!leftBoundary(text, i)) return null
  let k = 0
  while (i + k < text.length && text[i + k] === "*" && k < 3) k++
  const j = i + k
  if (j >= text.length) return null
  let search = j
  while (search < text.length) {
    const starIdx = text.indexOf("*", search)
    if (starIdx === -1) break
    let runLen = 0
    while (starIdx + runLen < text.length && text[starIdx + runLen] === "*") runLen++
    if (runLen !== k) {
      search = starIdx + runLen
      continue
    }
    const content = text.slice(j, starIdx)
    if (content.length === 0 || content.includes("*") || /^\s|\s$/.test(content)) {
      search = starIdx + runLen
      continue
    }
    if (!rightBoundary(text, starIdx + runLen)) {
      search = starIdx + runLen
      continue
    }
    const type = k === 3 ? "bi" : k === 2 ? "b" : "i"
    return { type, text: content, end: starIdx + runLen }
  }
  return null
}

function formatMessageText(text: string) {
  if (!text) return null
  const nodes: ReactNode[] = []
  let buf = ""
  let i = 0
  let key = 0
  while (i < text.length) {
    if (text[i] === "*") {
      const em = tryEmphasis(text, i)
      if (em) {
        if (buf) {
          nodes.push(buf)
          buf = ""
        }
        if (em.type === "b") {
          nodes.push(<b key={key++}>{em.text}</b>)
        } else if (em.type === "i") {
          nodes.push(
            <i key={key++} className="opacity-80">
              {em.text}
            </i>
          )
        } else {
          nodes.push(
            <i key={key++} className="opacity-80">
              <b>{em.text}</b>
            </i>
          )
        }
        i = em.end
        continue
      }
    }
    buf += text[i++]
  }
  if (buf) nodes.push(buf)
  return nodes
}

interface MessageBubbleProps {
  content: ContentItem
  avatarUrl?: string
  onAvatarTap?: () => void
  onUserMessageTap?: () => void
}

export const MessageBubble = memo(function MessageBubble({
  content,
  avatarUrl,
  onAvatarTap,
  onUserMessageTap,
}: MessageBubbleProps) {
  const pos = (content.position as string) || "LEFT"
  const longPressHandlers = useLongPress(onUserMessageTap ?? (() => {}))
  if (pos === "NARRATOR") {
    return (
      <div className="mx-auto my-2 max-w-full rounded-lg bg-muted/50 px-4 py-2 text-center text-sm whitespace-pre-wrap text-muted-foreground italic [overflow-wrap:anywhere] sm:max-w-md">
        {formatMessageText(content.text || "")}
      </div>
    )
  }
  const isRight = pos === "RIGHT"
  return (
    <div
      className={cn(
        "animate-msg-in my-1 flex min-w-0 gap-2",
        isRight ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isRight && (
        <Avatar
          className="size-8 shrink-0 cursor-pointer"
          onClick={onAvatarTap}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onAvatarTap?.()
            }
          }}
          aria-label={content.speakerName ? `キャラクター: ${content.speakerName}` : "キャラクター"}
        >
          <CachedAvatarImage src={avatarUrl} />
          <AvatarFallback>{(content.speakerName || "?")[0]}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "min-w-0 max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isRight
            ? "cursor-pointer bg-primary text-primary-foreground"
            : "bg-secondary"
        )}
        {...(isRight && onUserMessageTap ? longPressHandlers : {})}
      >
        {!isRight && content.speakerName && (
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {content.speakerName}
          </p>
        )}
        <div className="[overflow-wrap:anywhere] whitespace-pre-wrap">
          {formatMessageText(content.text || "")}
        </div>
      </div>
    </div>
  )
})
