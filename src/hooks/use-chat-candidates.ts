import { useState } from "react"
import type { Candidate, ContentItem, RuntimeMessage } from "@/lib/types"

type SwipeDirection = "prev" | "next" | null

export function useChatCandidates(
  _roomId: string | undefined,
  messages: RuntimeMessage[],
  setMessages: React.Dispatch<React.SetStateAction<RuntimeMessage[]>>,
  _scrollToBottom: () => void
) {
  const [candidatesCache] = useState<
    Record<string, { candidates: Candidate[]; currentIdx: number }>
  >({})

  const [regenMsgId] = useState<string | null>(null)
  const [regenContents] = useState<ContentItem[]>([])

  const [lastSwipeDirection, setLastSwipeDirection] = useState<{
    id: string
    direction: SwipeDirection
    key: number
  }>({ id: "", direction: null, key: 0 })

  // Switch candidate on an existing message (chacha: candidates are inline in message)
  async function handleSwitchCandidate(
    msgId: string,
    direction: "prev" | "next"
  ): Promise<boolean> {
    const msg = messages.find((m) => m.id === msgId)
    if (!msg?.candidates || msg.candidates.length <= 1) return false

    const currentIdx = msg.candidates.findIndex(
      (c) => c.id === msg.candidateId
    )
    const idx = currentIdx >= 0 ? currentIdx : 0

    let targetIdx: number
    if (direction === "next") {
      if (idx >= msg.candidates.length - 1) return false
      targetIdx = idx + 1
    } else {
      if (idx <= 0) return false
      targetIdx = idx - 1
    }

    const targetCandidate = msg.candidates[targetIdx]
    setLastSwipeDirection({
      id: msgId,
      direction,
      key: Date.now(),
    })

    // Update the message's candidateId
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, candidateId: targetCandidate.id, text: targetCandidate.text }
          : m
      )
    )

    return true
  }

  // Regen is not supported in chacha — stub implementation
  async function handleRegen(_msgId: string) {
    // no-op
  }

  return {
    candidatesCache,
    regenMsgId,
    regenContents,
    lastSwipeDirection,
    handleRegen,
    handleSwitchCandidate,
  }
}
