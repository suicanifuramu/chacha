import { useCallback, useMemo } from "react"
import { toast } from "sonner"
import {
  deleteRoom,
  createRoom,
} from "@/lib/api"
import { useLongPress } from "./use-long-press"

export interface UseChatActionsDeps {
  plotId: string
  roomId?: string
  navigate: (path: string) => void
  releaseBodyLock: () => void
  deleteMode: boolean
  exitDeleteMode: () => void
  enterDeleteMode: () => void
  onResetConfirmOpen: () => void
}

export interface UseChatActionsReturn {
  handleRoomReset: () => Promise<void>
  longPressHandlers: ReturnType<typeof useLongPress>
}

export function useChatActions(deps: UseChatActionsDeps): UseChatActionsReturn {
  const {
    plotId,
    roomId,
    navigate,
    releaseBodyLock,
    deleteMode,
    exitDeleteMode,
    enterDeleteMode,
    onResetConfirmOpen,
  } = deps

  const handleRoomReset = useCallback(async () => {
    if (!plotId || !roomId) return
    releaseBodyLock()
    try {
      // Delete current room
      await deleteRoom(roomId)

      // Create new room
      const createRes = await createRoom(plotId)
      const newRoomId = createRes.room?.id
      if (!newRoomId) {
        toast.error("ルーム作成に失敗しました")
        return
      }

      toast.success("ルームをリセットしました")
      navigate(`/chat/${newRoomId}`)
    } catch (e: unknown) {
      toast.error(
        `ルームリセット失敗: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }, [plotId, roomId, navigate, releaseBodyLock])

  const handleResetConfirmAccess = useCallback(
    () => onResetConfirmOpen(),
    [onResetConfirmOpen]
  )
  const handleDeleteToggle = useCallback(
    () => {
      if (deleteMode) exitDeleteMode()
      else enterDeleteMode()
    },
    [deleteMode, exitDeleteMode, enterDeleteMode]
  )

  const longPressHandlers = useLongPress(
    handleResetConfirmAccess,
    handleDeleteToggle
  )

  return useMemo(
    () => ({
      handleRoomReset,
      longPressHandlers,
    }),
    [handleRoomReset, longPressHandlers]
  )
}
