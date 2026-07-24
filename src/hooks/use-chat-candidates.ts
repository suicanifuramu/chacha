import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import {
  regenMessageStream,
  selectCandidate,
  getMessages,
} from "@/lib/api"
import { parseBotContents, normalizeMessage, normalizeMessages } from "@/hooks/use-chat-messages"
import type { Candidate, ContentItem, RuntimeMessage } from "@/lib/types"

type SwipeDirection = "prev" | "next" | "regen" | null

export function useChatCandidates(
  roomId: string | undefined,
  messages: RuntimeMessage[],
  setMessages: React.Dispatch<React.SetStateAction<RuntimeMessage[]>>,
  chatRefs: React.MutableRefObject<{ scrollToBottom?: () => void }>
) {
  const [candidatesCache, setCandidatesCache] = useState<
    Record<string, { candidates: Candidate[]; currentIdx: number }>
  >({})

  const [regenMsgId, setRegenMsgId] = useState<string | null>(null)
  const [regenContents, setRegenContents] = useState<ContentItem[]>([])

  const [lastSwipeDirection, setLastSwipeDirection] = useState<{
    id: string
    direction: SwipeDirection
    key: number
  }>({ id: "", direction: null, key: 0 })
  const swipeKeyRef = useRef(0)

  async function ensureCandidatesCached(
    msgId: string
  ): Promise<{ candidates: Candidate[]; currentIdx: number } | null> {
    const cached = candidatesCache[msgId]
    if (cached) return cached
    const currentMsg = messages.find((m) => m.id === msgId)
    const msgCandidates = currentMsg?.candidates
    if (!msgCandidates || msgCandidates.length === 0) return null
    const activeCandId = currentMsg?.candidateId || currentMsg?.primaryCandidateId
    const currentIdx = activeCandId
      ? msgCandidates.findIndex((c) => c.id === activeCandId)
      : 0
    const entry = {
      candidates: msgCandidates,
      currentIdx: currentIdx >= 0 ? currentIdx : msgCandidates.length - 1,
    }
    setCandidatesCache((prev) => ({ ...prev, [msgId]: entry }))
    return entry
  }

  const handleRegen = useCallback(
    async (msgId: string) => {
      if (!roomId) return
      const el = document.getElementById(`msg-swipe-${msgId}`)
      if (el) {
        el.style.transition = "none"
        el.style.transform = "translateX(0px)"
      }
      swipeKeyRef.current += 1
      setLastSwipeDirection({
        id: msgId,
        direction: "regen",
        key: swipeKeyRef.current,
      })
      setRegenMsgId(msgId)
      setRegenContents([])

      try {
        let accumulatedText = ""
        let streamErrored = false
        let createdMessagesJson = ""

        await regenMessageStream(
          roomId,
          (event) => {
            const e = event as string
            if (typeof e !== "string") {
              if (
                (e as { event?: string }).event === "ERROR" ||
                (e as { type?: string }).type === "CHAT_ERROR"
              ) {
                streamErrored = true
              }
              return
            }
            if (e.startsWith("0:")) {
              const raw = e.slice(2)
              try {
                accumulatedText += JSON.parse(raw) as string
                setRegenContents(parseBotContents(accumulatedText))
              } catch {
                accumulatedText += raw
              }
            } else if (e.startsWith("8:")) {
              const raw = e.slice(2)
              try {
                const parsed = JSON.parse(raw) as Array<{
                  source?: string
                  botMessageId?: string
                  createdMessagesJson?: string
                  status?: string
                }>
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const item = parsed[0]
                  if (item.source === "STREAM" && !item.createdMessagesJson)
                    return
                  if (item.createdMessagesJson) {
                    createdMessagesJson = item.createdMessagesJson
                  }
                  if (item.status && item.status !== "success") {
                    streamErrored = true
                  }
                }
              } catch {
                /* ignore */
              }
            }
          },
          async () => {
            if (streamErrored) {
              toast.error("再生成に失敗しました")
              setRegenMsgId(null)
              setRegenContents([])
              return
            }

            if (createdMessagesJson) {
              try {
                const created = JSON.parse(createdMessagesJson) as {
                  botMessage?: RuntimeMessage
                }
                if (created.botMessage) {
                  const updated = normalizeMessage(created.botMessage)
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === updated.id ? updated : m
                    )
                  )
                }
              } catch {
                /* fall through to reload */
              }
            }

            try {
              const data = await getMessages(roomId, 50)
              setMessages(normalizeMessages([...(data.messages || [])].reverse()))
              setCandidatesCache((prev) => {
                const next = { ...prev }
                delete next[msgId]
                return next
              })
            } catch {
              /* ignore */
            }

            setRegenMsgId(null)
            setRegenContents([])
            toast.success("再生成しました")
            setTimeout(() => chatRefs.current.scrollToBottom?.(), 50)
          }
        )
      } catch (e: unknown) {
        toast.error(
          `再生成失敗: ${e instanceof Error ? e.message : String(e)}`
        )
        setRegenMsgId(null)
        setRegenContents([])
      }
    },
    [roomId, chatRefs, setMessages]
  )

  const handleSwitchCandidate = useCallback(
    async (
      msgId: string,
      direction: "prev" | "next"
    ): Promise<boolean> => {
      if (!roomId) return false
      try {
        const cached = await ensureCandidatesCached(msgId)
        if (!cached) return false
        const { candidates, currentIdx } = cached

        if (candidates.length <= 1) {
          if (direction === "next") {
            handleRegen(msgId)
            return true
          } else {
            toast.info("候補がありません")
            return false
          }
        }

        let targetIdx: number
        if (direction === "next") {
          if (currentIdx >= candidates.length - 1) {
            handleRegen(msgId)
            return true
          }
          targetIdx = currentIdx + 1
        } else {
          if (currentIdx <= 0) {
            toast.info("最初の候補です")
            return false
          }
          targetIdx = currentIdx - 1
        }

        const targetCandidate = candidates[targetIdx]
        swipeKeyRef.current += 1
        setLastSwipeDirection({
          id: msgId,
          direction,
          key: swipeKeyRef.current,
        })

        setCandidatesCache((prev) => ({
          ...prev,
          [msgId]: { ...prev[msgId], currentIdx: targetIdx },
        }))

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  candidateId: targetCandidate.id,
                  text: targetCandidate.text,
                  contents: parseBotContents(targetCandidate.text),
                  activeStatus: targetCandidate.status ?? undefined,
                }
              : m
          )
        )

        const el = document.getElementById(`msg-swipe-${msgId}`)
        if (el) {
          el.style.transition = "none"
          el.style.transform = "translateX(0px)"
        }

        selectCandidate(msgId, targetCandidate.id).catch((e: unknown) => {
          console.warn(
            "selectCandidate bg:",
            e instanceof Error ? e.message : String(e)
          )
        })

        setTimeout(() => chatRefs.current.scrollToBottom?.(), 50)
        return true
      } catch (e: unknown) {
        toast.error(
          `候補切り替え失敗: ${e instanceof Error ? e.message : String(e)}`
        )
        return false
      }
    },
    [roomId, chatRefs, setMessages, handleRegen, messages, candidatesCache]
  )

  return {
    candidatesCache,
    regenMsgId,
    regenContents,
    lastSwipeDirection,
    handleRegen,
    handleSwitchCandidate,
  }
}
