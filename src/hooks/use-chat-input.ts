import { useState, useRef, useCallback, useEffect } from "react"
import type { SendMessageOptions } from "./use-chat-messages"

export interface UseChatInputDeps {
  roomId: string | undefined
  sending: boolean
  regenerating: boolean
  sendChatMessage: (options: SendMessageOptions) => Promise<boolean>
  scrollToBottom: () => void
  clearRecItems: () => void
  setRecVisible: React.Dispatch<React.SetStateAction<boolean>>
}

export interface UseChatInputReturn {
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  editingMsg: { id: string; candidateId: string } | null
  setEditingMsg: React.Dispatch<
    React.SetStateAction<{ id: string; candidateId: string } | null>
  >
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  sendMessage: () => Promise<void>
  handleEditMessage: (msgId: string, candidateId: string, text: string) => void
  insertAsterisk: () => void
}

export function useChatInput(deps: UseChatInputDeps): UseChatInputReturn {
  const {
    roomId,
    sending,
    regenerating,
    sendChatMessage,
    scrollToBottom,
    clearRecItems,
    setRecVisible,
  } = deps

  const [inputValue, setInputValue] = useState("")
  const [editingMsg, setEditingMsg] = useState<{
    id: string
    candidateId: string
  } | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevHeightRef = useRef<number>(0)

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim()
    if (sending || regenerating || !roomId) return

    if (editingMsg) {
      const ok = await sendChatMessage({ text, editing: editingMsg })
      if (ok) {
        setEditingMsg(null)
        setInputValue("")
        setRecVisible(false)
        clearRecItems()
        inputRef.current?.focus({ preventScroll: true })
      }
      return
    }

    const raw = inputValue
    setInputValue("")
    inputRef.current?.focus({ preventScroll: true })
    setRecVisible(false)
    clearRecItems()

    const ok = await sendChatMessage({ text })
    if (!ok) {
      setInputValue(raw)
    }
    if (document.activeElement === inputRef.current) {
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [
    inputValue,
    sending,
    regenerating,
    roomId,
    editingMsg,
    sendChatMessage,
    setRecVisible,
    clearRecItems,
  ])

  const handleEditMessage = useCallback(
    (msgId: string, candidateId: string, text: string) => {
      setEditingMsg({ id: msgId, candidateId })
      setInputValue(text)
      setTimeout(() => inputRef.current?.focus(), 0)
    },
    []
  )

  const insertAsterisk = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const val = inputValue
    const newVal = val.slice(0, start) + "*" + val.slice(end)
    setInputValue(newVal)
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = (start ?? 0) + 1
      el.focus()
    }, 0)
  }, [inputValue])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      const newHeight = Math.min(inputRef.current.scrollHeight, 112)
      inputRef.current.style.height = `${newHeight}px`

      if (prevHeightRef.current > 0 && prevHeightRef.current !== newHeight) {
        scrollToBottom()
      }
      prevHeightRef.current = newHeight
    }
  }, [inputValue, scrollToBottom])

  return {
    inputValue,
    setInputValue,
    editingMsg,
    setEditingMsg,
    inputRef,
    sendMessage,
    handleEditMessage,
    insertAsterisk,
  }
}
