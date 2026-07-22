import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface DeleteModeOverlayProps {
  deleteMode: boolean
  selectedMsgId: string | null
  deleting: boolean
  onDelete: () => void
  onCancel: () => void
}

export function DeleteModeOverlay({
  deleteMode,
  selectedMsgId,
  deleting,
  onDelete,
  onCancel,
}: DeleteModeOverlayProps) {
  if (!deleteMode) return null

  return (
    <div className="animate-slide-up absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
      <div className="glass flex items-center gap-3 rounded-2xl border border-destructive/30 px-5 py-3 shadow-lg shadow-destructive/10">
        <div className="text-sm whitespace-nowrap">
          {selectedMsgId ? (
            <span className="font-medium text-destructive">
              選択以降を削除
            </span>
          ) : (
            <span className="text-muted-foreground">
              メッセージをタップ
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={onCancel}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full"
            disabled={!selectedMsgId || deleting}
            onClick={onDelete}
          >
            {deleting && <Spinner className="mr-1 size-3" />}
            削除
          </Button>
        </div>
      </div>
    </div>
  )
}
