import { memo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CachedAvatarImage } from "@/components/cached-avatar-image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { deleteRoom } from "@/lib/api"

interface ChatHeaderProps {
  plotName: string
  plotImg: string
  headerSub: string
  deleteMode: boolean
  exitConfirmOpen: boolean
  onExitConfirmChange: (open: boolean) => void
  resetConfirmOpen: boolean
  onResetConfirmChange: (open: boolean) => void
  roomId?: string
  onLongPressHandlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseUp: (e: React.MouseEvent) => void
    onMouseLeave: (e: React.MouseEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onClick: (e: React.MouseEvent) => void
  }
  onHeaderClick: () => void
  onResetRoom: () => void
  releaseBodyLock: () => void
  onExitRoom?: () => void
  onProfileClick?: () => void
}

export const ChatHeader = memo(function ChatHeader({
  plotName,
  plotImg,
  headerSub,
  deleteMode,
  exitConfirmOpen,
  onExitConfirmChange,
  resetConfirmOpen,
  onResetConfirmChange,
  roomId,
  onLongPressHandlers,
  onHeaderClick,
  onResetRoom,
  releaseBodyLock,
  onExitRoom,
  onProfileClick,
}: ChatHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="glass sticky top-0 z-20 flex items-center gap-3 border-b border-border px-3 py-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/rooms")}
        aria-label="チャットルーム一覧に戻る"
      >
        <ArrowLeft className="size-5" />
      </Button>
      <Avatar className="size-9" aria-hidden={true}>
        <CachedAvatarImage src={plotImg} alt={plotName} />
        <AvatarFallback>{plotName[0]}</AvatarFallback>
      </Avatar>
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={onHeaderClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onHeaderClick()
          }
        }}
        aria-label={`プロット: ${plotName}`}
      >
        <p className="truncate text-sm font-semibold">{plotName}</p>
        <p className="truncate text-xs text-muted-foreground">{headerSub}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="トークプロフィールを変更"
        onClick={onProfileClick}
      >
        <User className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={deleteMode ? "削除モード中：タップして終了" : "メッセージを削除する"}
        className={cn(deleteMode && "text-destructive", "select-none")}
        {...onLongPressHandlers}
      >
        <Trash2 className="size-4" />
      </Button>
      <AlertDialog open={exitConfirmOpen} onOpenChange={onExitConfirmChange}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onExitConfirmChange(true)}
          >
            退出
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>チャットから退出</AlertDialogTitle>
            <AlertDialogDescription>
              このチャットから退出しますか？メッセージは削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onExitConfirmChange(false)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                onExitRoom?.()
                releaseBodyLock()
                try {
                  await deleteRoom(roomId!)
                  toast.success("退出しました")
                  navigate("/rooms")
                } catch (e: unknown) {
                  toast.error(
                    `退出失敗: ${e instanceof Error ? e.message : String(e)}`
                  )
                }
              }}
            >
              退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={resetConfirmOpen} onOpenChange={onResetConfirmChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ルームをリセット</AlertDialogTitle>
            <AlertDialogDescription>
              新しいルームを作成して会話をリセットしますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onResetConfirmChange(false)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction onClick={onResetRoom}>
              リセット
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
})
