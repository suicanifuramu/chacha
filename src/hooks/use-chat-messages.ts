import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import {
  getMessages,
  getMessagesByCursor,
  sendMessageStream,
  editMessage,
} from "@/lib/api"
import type { ContentItem, Message, RuntimeMessage } from "@/lib/types"

export function parseBotContents(text: string): ContentItem[] {
  const matches = [...text.matchAll(/@([^\n@]+):/g)]
  if (matches.length === 0) return [{ position: "LEFT", text: text.trim() }]
  return matches.map((m, idx) => {
    const name = m[1].trim()
    const start = m.index! + m[0].length
    const end = idx < matches.length - 1 ? matches[idx + 1].index! : text.length
    const seg = text.slice(start, end).trim()
    return {
      speakerName: name,
      position: name === "ナレーター" ? "NARRATOR" : "LEFT",
      text: seg,
    }
  })
}

export function normalizeMessage(m: Message): RuntimeMessage {
  const candidate = m.primaryCandidateId
    ? m.candidates?.find(c => c.id === m.primaryCandidateId) || m.candidates?.[0]
    : m.candidates?.[0]
  const text = candidate?.text || m.text || ""
  const base: RuntimeMessage = {
    id: m.id,
    roomId: m.roomId || "",
    senderId: m.senderId || "",
    authorType: m.authorType,
    text,
    createdAt: m.createdAt,
    candidateId: candidate?.id,
    candidates: m.candidates,
    sender: m.authorType === "USER" ? { type: "USER" } : { type: "BOT" },
    activeStatus: candidate?.status ?? undefined,
  }
  base.contents =
    m.authorType === "USER"
      ? [{ position: "RIGHT", text }]
      : parseBotContents(text)
  return base
}

export function normalizeMessages(msgs: Message[]): RuntimeMessage[] {
  return msgs.map(normalizeMessage)
}

export interface SendMessageOptions {
  text: string
  editing?: { id: string; candidateId: string }
}

export interface UseChatMessagesDeps {
  chatRefs: React.MutableRefObject<{
    scrollToBottom?: () => void
    getViewport?: () => HTMLElement | null
    setMessages?: React.Dispatch<React.SetStateAction<RuntimeMessage[]>>
  }>
  onEmptyRoomDetected: () => void
  onClearRecommendations: () => void
}

export interface UseChatMessagesReturn {
  messages: RuntimeMessage[]
  loading: boolean
  sending: boolean
  loadingHistory: boolean
  hasMoreHistory: boolean
  streamContents: ContentItem[] | null
  setMessages: React.Dispatch<React.SetStateAction<RuntimeMessage[]>>
  loadInitialMessages: () => Promise<void>
  loadOlderMessagesRef: React.MutableRefObject<(() => Promise<void>) | undefined>
  sendMessage: (options: SendMessageOptions) => Promise<boolean>
}

export function useChatMessages(
  roomId: string | undefined,
  deps: UseChatMessagesDeps
): UseChatMessagesReturn {
  const {
    chatRefs,
    onEmptyRoomDetected,
    onClearRecommendations,
  } = deps

  const [messages, setMessages] = useState<RuntimeMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const [streamText, setStreamText] = useState<string | null>(null)

  const loadInitialMessages = useCallback(async () => {
    if (!roomId) return
    setLoading(true)
    setHasMoreHistory(true)
    setMessages([])
    setStreamText(null)

    try {
      const data = await getMessages(roomId, 50)
      const msgs = data.messages || []
      if (msgs.length === 0) {
        await onEmptyRoomDetected()
      } else {
        setMessages(normalizeMessages([...msgs].reverse()))
        if (msgs.length < 50) setHasMoreHistory(false)
      }
    } catch (e: unknown) {
      toast.error(
        `メッセージ読み込み失敗: ${e instanceof Error ? e.message : String(e)}`
      )
    } finally {
      setLoading(false)
    }
  }, [roomId, onEmptyRoomDetected])

  const loadOlderMessagesRef = useRef<(() => Promise<void>) | undefined>(undefined)

  const loadOlderMessages = useCallback(async () => {
    if (!roomId || loadingHistory || !hasMoreHistory || messages.length === 0)
      return
    const oldestMsg = messages[0]
    if (!oldestMsg?.createdAt) return
    setLoadingHistory(true)
    try {
      const viewport = chatRefs.current.getViewport?.()
      const prevScrollHeight = viewport?.scrollHeight || 0
      const data = await getMessagesByCursor(roomId, oldestMsg.createdAt, 30)
       const olderMsgs = normalizeMessages([...(data.messages || [])].reverse())
      if (olderMsgs.length === 0) {
        setHasMoreHistory(false)
      } else {
        const existingIds = new Set(messages.map((m) => m.id))
        const newMsgs = olderMsgs.filter((m) => !existingIds.has(m.id))
        if (newMsgs.length === 0) {
          setHasMoreHistory(false)
        } else {
          setMessages((prev) => [...newMsgs, ...prev])
          if (olderMsgs.length < 30) setHasMoreHistory(false)
          requestAnimationFrame(() => {
            const vp = chatRefs.current.getViewport?.()
            if (vp) {
              vp.scrollTop = vp.scrollHeight - prevScrollHeight
            }
          })
        }
      }
    } catch (e: unknown) {
      toast.error(
        `過去メッセージ取得失敗: ${e instanceof Error ? e.message : String(e)}`
      )
    } finally {
      setLoadingHistory(false)
    }
  }, [roomId, loadingHistory, hasMoreHistory, messages, chatRefs])

  loadOlderMessagesRef.current = loadOlderMessages

  chatRefs.current.setMessages = setMessages

  useEffect(() => {
    if (!roomId) return
    loadInitialMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const sendMessage = useCallback(
    async (options: SendMessageOptions) => {
      const { text, editing } = options
      if (sending || !roomId) return false
      setSending(true)

      if (editing) {
        try {
          await editMessage(editing.id, text)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === editing.id
                ? {
                    ...m,
                    text,
                    contents:
                      m.authorType === "USER"
                        ? [{ position: "RIGHT", text }]
                        : parseBotContents(text),
                    candidates: m.candidates?.map((c) =>
                      c.id === editing.candidateId
                        ? { ...c, text }
                        : c
                    ),
                  }
                : m
            )
          )
          return true
        } catch (e: unknown) {
          toast.error(
            `編集失敗: ${e instanceof Error ? e.message : String(e)}`
          )
          return false
        } finally {
          setSending(false)
        }
      }

      const isEmptyMessage = !text

      let tempMsgId: string | null = null
      if (!isEmptyMessage) {
        const tempUserMsg: RuntimeMessage = {
          id: `temp-user-${Date.now()}`,
          roomId: roomId || "",
          senderId: "",
          text,
          authorType: "USER",
          sender: { type: "USER" },
          contents: [{ position: "RIGHT", text }],
        }
        tempMsgId = tempUserMsg.id
        setMessages((prev) => [...prev, tempUserMsg])
      }
      setStreamText("")
      setTimeout(() => chatRefs.current.scrollToBottom?.(), 30)

      try {
        let accumulatedText = ""
        let streamErrored = false
        let failed = false
        let botMessageId = ""
        let userMessageId = ""
        let createdMessagesJson = ""

        await sendMessageStream(
          roomId,
          text,
          (event) => {
            const e = event as string | { event?: string; type?: string }
            if (typeof e === "string") {
              // chacha format: "0:\"text\""
              if (e.startsWith("0:")) {
                const raw = e.slice(2)
                try {
                  const parsed = JSON.parse(raw) as string
                  accumulatedText += parsed
                  setStreamText(accumulatedText)
                  setTimeout(() => chatRefs.current.scrollToBottom?.(), 10)
                } catch {
                  // not valid JSON string, try raw
                  accumulatedText += raw
                  setStreamText(accumulatedText)
                }
              } else if (e.startsWith("f:")) {
                const raw = e.slice(2)
                try {
                  const parsed = JSON.parse(raw) as { messageId?: string }
                  if (parsed.messageId) botMessageId = parsed.messageId
                } catch { /* ignore */ }
              } else if (e.startsWith("8:")) {
                const raw = e.slice(2)
                try {
                  const parsed = JSON.parse(raw) as Array<{
                    botMessageId?: string
                    userMessageId?: string
                    createdMessagesJson?: string
                    status?: string
                    source?: string
                  }>
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    const item = parsed[0]
                    // Start marker: 8:[{"source":"STREAM"}] — ignore
                    if (item.source === "STREAM" && !item.createdMessagesJson) {
                      return
                    }
                    if (item.botMessageId) botMessageId = item.botMessageId
                    if (item.userMessageId) userMessageId = item.userMessageId
                    if (item.createdMessagesJson) {
                      createdMessagesJson = item.createdMessagesJson
                    }
                    if (item.status && item.status !== "success") {
                      streamErrored = true
                    }
                  }
                } catch { /* ignore */ }
              }
              return
            }

            // Standard format fallback
            if (e.event === "ERROR" || e.type === "CHAT_ERROR") {
              streamErrored = true
            }
          },
          async () => {
            if (streamErrored) {
              toast.error("送信に失敗しました")
              failed = true
              if (tempMsgId) {
                setMessages((prev) => prev.filter((m) => m.id !== tempMsgId))
              }
              setStreamText(null)
              return
            }

            // Prefer stream metadata (8: createdMessagesJson); reload only as fallback
            let appliedFromStream = false
            if (createdMessagesJson) {
              try {
                const created = JSON.parse(createdMessagesJson) as {
                  userMessage?: Message
                  botMessage?: Message
                }
                const toAppend: RuntimeMessage[] = []
                if (created.userMessage) {
                  toAppend.push(normalizeMessage(created.userMessage))
                }
                if (created.botMessage) {
                  toAppend.push(normalizeMessage(created.botMessage))
                }
                if (toAppend.length > 0) {
                  setMessages((prev) => {
                    const withoutTemp = tempMsgId
                      ? prev.filter((m) => m.id !== tempMsgId)
                      : prev
                    const existingIds = new Set(withoutTemp.map((m) => m.id))
                    const fresh = toAppend.filter((m) => !existingIds.has(m.id))
                    return fresh.length > 0
                      ? [...withoutTemp, ...fresh]
                      : withoutTemp
                  })
                  appliedFromStream = true
                }
              } catch {
                // fall through to reload
              }
            }

            if (!appliedFromStream) {
              const data = await getMessages(roomId, 50)
              setMessages(
                normalizeMessages([...(data.messages || [])].reverse())
              )
            }
            onClearRecommendations()
            setStreamText(null)
            setTimeout(() => chatRefs.current.scrollToBottom?.(), 50)
          }
        )
        return !failed
      } catch (e: unknown) {
        toast.error(
          `送信失敗: ${e instanceof Error ? e.message : String(e)}`
        )
        setStreamText(null)
        if (tempMsgId) {
          setMessages((prev) => prev.filter((m) => m.id !== tempMsgId))
        }
        return false
      } finally {
        setSending(false)
      }
    },
    [roomId, sending, chatRefs, onClearRecommendations]
  )

  const streamContents: ContentItem[] | null =
    streamText !== null
      ? streamText
        ? parseBotContents(streamText)
        : []
      : null

  return {
    messages,
    loading,
    sending,
    loadingHistory,
    hasMoreHistory,
    streamContents,
    setMessages,
    loadInitialMessages,
    loadOlderMessagesRef,
    sendMessage,
  }
}
