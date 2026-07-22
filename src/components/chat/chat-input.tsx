import { forwardRef } from "react"
import { Asterisk, Send, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  inputValue: string
  onInputChange: (value: string) => void
  sending: boolean
  recVisible: boolean
  onToggleRecommend: () => void
  onSend: () => void
  onInsertAsterisk: () => void
  editingMsg: { id: string; candidateId: string } | null
  onCancelEdit: () => void
  needsInit: boolean
  onOpenProfileSheet: () => void
  profileSheetOpen: boolean
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput({
  inputValue,
  onInputChange,
  sending,
  recVisible,
  onToggleRecommend,
  onSend,
  onInsertAsterisk,
  editingMsg,
  onCancelEdit,
  needsInit,
  onOpenProfileSheet,
  profileSheetOpen,
}, inputRef) {

  if (needsInit) {
    return (
      <div className="border-t border-border px-4 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          プロフィールを選択してチャットを開始してください
        </p>
        {!profileSheetOpen && (
          <Button
            size="sm"
            className="mt-2 cursor-pointer"
            onClick={onOpenProfileSheet}
          >
            プロフィールを選択
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="glass border-t border-border px-3 py-2">
      {editingMsg && (
        <div className="mb-2 flex items-center justify-between px-1 text-xs text-primary">
          <span>メッセージを編集中...</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-muted-foreground hover:text-foreground"
            onClick={onCancelEdit}
          >
            キャンセル
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn("shrink-0", recVisible && "text-primary")}
          onClick={onToggleRecommend}
          aria-label="推薦文"
        >
          <Star className="size-5" />
        </Button>
        <div className="relative flex-1">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                ;(inputRef as React.RefObject<HTMLTextAreaElement | null>)?.current?.focus({ preventScroll: true })
                onSend()
              }
            }}
            placeholder="メッセージを入力..."
            className="max-h-28 min-h-10 resize-none overscroll-contain border-0 bg-secondary/50 pr-9 text-sm"
            rows={1}
            style={{ fontSize: "16px" }}
            inputMode="text"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-0 right-1 bottom-0 my-auto size-8 rounded-full bg-secondary text-foreground shadow-sm hover:bg-secondary/80"
            onClick={onInsertAsterisk}
            aria-label="アスタリスクを挿入"
          >
            <Asterisk className="size-4" />
          </Button>
        </div>
        <Button
          size="icon"
          disabled={sending}
          onPointerDown={(e) => {
            e.preventDefault()
            ;(inputRef as React.RefObject<HTMLTextAreaElement | null>)?.current?.focus({ preventScroll: true })
          }}
          onClick={onSend}
          aria-label="送信"
        >
          {sending ? (
            <Spinner className="size-4" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
})
