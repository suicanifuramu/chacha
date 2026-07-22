import { useState, useCallback } from "react"
import { toast } from "sonner"
import {
  getMessages,
  getUserChatProfiles,
  startRoom,
} from "@/lib/api"
import type {
  UserChatProfile,
  RuntimeMessage,
  Message,
} from "@/lib/types"
import type { PlotProfileItem } from "@/components/profile-select-sheet"
import { normalizeMessages } from "./use-chat-messages"
import { persistDefaultProfileName } from "@/lib/user-vars"

export interface UseChatProfileDeps {
  roomId: string | undefined
  plotId: string
  setPlotId: React.Dispatch<React.SetStateAction<string>>
  setCharAvatars: React.Dispatch<React.SetStateAction<Record<string, string>>>
  chatRefs: React.MutableRefObject<{
    scrollToBottom?: () => void
    setMessages?: React.Dispatch<React.SetStateAction<RuntimeMessage[]>>
  }>
}

export interface UseChatProfileReturn {
  needsInit: boolean
  setNeedsInit: React.Dispatch<React.SetStateAction<boolean>>
  profileSheetOpen: boolean
  setProfileSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  profileList: UserChatProfile[]
  setProfileList: React.Dispatch<React.SetStateAction<UserChatProfile[]>>
  profileLoading: boolean
  setProfileLoading: React.Dispatch<React.SetStateAction<boolean>>
  plotChatProfiles: PlotProfileItem[]
  setPlotChatProfiles: React.Dispatch<React.SetStateAction<PlotProfileItem[]>>
  onEmptyRoomDetected: () => Promise<void>
  handleProfileSelect: (profile: UserChatProfile) => Promise<void>
  handlePlotProfileSelect: (profile: PlotProfileItem) => Promise<void>
  handleCreateProfile: (profile: UserChatProfile) => Promise<void>
  handleProfileUpdated: () => Promise<void>
}

export function useChatProfile(
  deps: UseChatProfileDeps
): UseChatProfileReturn {
  const {
    roomId,
    plotId,
    setPlotId,
    setCharAvatars,
    chatRefs,
  } = deps

  const [needsInit, setNeedsInit] = useState(false)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [profileList, setProfileList] = useState<UserChatProfile[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [plotChatProfiles, setPlotChatProfiles] = useState<PlotProfileItem[]>(
    []
  )

  const onEmptyRoomDetected = useCallback(async () => {
    if (!roomId) return
    setNeedsInit(true)
    try {
      setProfileLoading(true)
      const profData = await getUserChatProfiles(20)
      const profiles = profData.chatUserProfiles || profData.userChatProfiles || []
      setProfileList(profiles)
      persistDefaultProfileName(profiles)
      setProfileLoading(false)
      setProfileSheetOpen(true)
    } catch (e: unknown) {
      toast.error(
        `初期化失敗: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }, [roomId, setPlotId, setCharAvatars, chatRefs])

  const finalizeProfileStart = useCallback(
    async (name: string) => {
      if (!roomId) return
      try {
        const data = await getMessages(roomId, 50)
        const normalized = normalizeMessages([...(data.messages || [])].reverse())
        chatRefs.current.setMessages?.(normalized)
      } catch {
        // ignore - messages may not exist yet
      }
      setNeedsInit(false)
      setProfileSheetOpen(false)
      toast.success(`「${name}」で開始しました`)
      chatRefs.current.scrollToBottom?.()
    },
    [roomId, chatRefs]
  )

  const handleProfileSelect = useCallback(
    async (profile: UserChatProfile) => {
      if (!roomId) return
      try {
        await startRoom(roomId, profile.id)
        await finalizeProfileStart(profile.userAlias || profile.name || "プロフィール")
      } catch (e: unknown) {
        toast.error(
          `チャット開始失敗: ${e instanceof Error ? e.message : String(e)}`
        )
      }
    },
    [roomId, plotId, finalizeProfileStart]
  )

  const handlePlotProfileSelect = useCallback(
    async (profile: PlotProfileItem) => {
      if (!roomId || !plotId) return
      try {
        await startRoom(roomId, profile.id)
        await finalizeProfileStart(profile.name)
      } catch (e: unknown) {
        toast.error(
          `チャット開始失敗: ${e instanceof Error ? e.message : String(e)}`
        )
      }
    },
    [roomId, plotId, finalizeProfileStart]
  )

  const handleCreateProfile = useCallback(
    async (profile: UserChatProfile) => {
      await handleProfileSelect(profile)
    },
    [handleProfileSelect]
  )

  const handleProfileUpdated = useCallback(async () => {
    try {
      const profData = await getUserChatProfiles(20)
      const profiles = profData.chatUserProfiles || profData.userChatProfiles || []
      setProfileList(profiles)
      persistDefaultProfileName(profiles)
    } catch {
      // ignore
    }
  }, [setProfileList])

  return {
    needsInit,
    setNeedsInit,
    profileSheetOpen,
    setProfileSheetOpen,
    profileList,
    setProfileList,
    profileLoading,
    setProfileLoading,
    plotChatProfiles,
    setPlotChatProfiles,
    onEmptyRoomDetected,
    handleProfileSelect,
    handlePlotProfileSelect,
    handleCreateProfile,
    handleProfileUpdated,
  }
}
