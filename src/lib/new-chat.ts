// Lightweight new-chat helper. Opens original flow via navigation.
import { toast } from "sonner"
import {
  getRoomByBotId,
  createRoom,
  getUserChatProfiles,
  getPlot,
} from "@/lib/api"
import { proxyImage } from "@/lib/api"
import { persistDefaultProfileName, replaceUserVars } from "@/lib/user-vars"

export async function startNewChat(
  plotId: string,
  navigate: (path: string) => void
) {
  try {
    // Pre-fetch plot info for header display before navigating
    sessionStorage.setItem("chat_plot_id", plotId)
    getPlot(plotId)
      .then((plot) => {
        const name = replaceUserVars(plot.name || "")
        if (name) sessionStorage.setItem("chat_plot_name", name)
        const img = proxyImage(plot.thumbnailImage?.url || null)
        sessionStorage.setItem("chat_plot_img", img)
      })
      .catch(() => {})

    // Check if room already exists
    let roomId: string | undefined
    try {
      const roomCheck = await getRoomByBotId(plotId)
      if (roomCheck.hasRoom && roomCheck.roomId) {
        roomId = roomCheck.roomId
      }
    } catch {
      /* no active room */
    }

    if (!roomId) {
      // Create new room
      toast.info("ルームを作成中…")

      // Validate that user has at least one profile
      const profilesData = await getUserChatProfiles(10)
      const profiles = profilesData.chatUserProfiles || []
      persistDefaultProfileName(profiles)
      if (!profiles.length) {
        toast.error("ユーザープロフィールがありません")
        return
      }

      const createRes = await createRoom(plotId)
      const newRoomId = createRes.room?.id
      if (!newRoomId) {
        toast.error("ルーム作成に失敗しました")
        return
      }

      roomId = newRoomId
    }

    if (!roomId) {
      toast.error("ルーム作成に失敗しました")
      return
    }

    navigate(`/chat/${roomId}`)
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : String(e))
  }
}
