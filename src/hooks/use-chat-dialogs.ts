import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"
import {
  getMyPlotChatProfile,
  getPlot,
  getRoom,
  getUserChatProfiles,
  selectUserChatProfile,
  selectPlotChatProfile,
} from "@/lib/api"
import type {
  Character,
  PlotDetailResponse,
  UserChatProfile,
} from "@/lib/types"
import type { PlotProfileItem } from "@/components/profile-select-sheet"
import { persistDefaultProfileName } from "@/lib/user-vars"

export interface UseChatDialogsDeps {
  roomId: string | undefined
  plotId: string
  setPlotId: React.Dispatch<React.SetStateAction<string>>
  characters: Character[]
}

export interface UseChatDialogsReturn {
  plotDetailOpen: boolean
  setPlotDetailOpen: React.Dispatch<React.SetStateAction<boolean>>
  plotDetailData: PlotDetailResponse | null
  characterDetailOpen: boolean
  setCharacterDetailOpen: React.Dispatch<React.SetStateAction<boolean>>
  selectedCharacter: Character | null
  changeProfileSheetOpen: boolean
  setChangeProfileSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  changeProfileList: UserChatProfile[]
  changePlotProfiles: PlotProfileItem[]
  changeProfileLoading: boolean
  changeProfileInitialId: string | null
  exitConfirmOpen: boolean
  setExitConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>
  resetConfirmOpen: boolean
  setResetConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleCharacterClick: (character: Character) => void
  handleAvatarTap: (characterName: string) => void
  handleUserMessageTap: () => void
  handleChangeProfile: () => Promise<void>
  handleChangeProfileSelect: (profile: UserChatProfile) => Promise<void>
  handleChangePlotProfileSelect: (profile: PlotProfileItem) => Promise<void>
  handleCreateChangeProfile: (profile: UserChatProfile) => Promise<void>
  handleProfileUpdated: () => Promise<void>
  handleHeaderClick: () => Promise<void>
}

export function useChatDialogs(deps: UseChatDialogsDeps): UseChatDialogsReturn {
  const { roomId, plotId, setPlotId, characters } = deps

  const [plotDetailOpen, setPlotDetailOpen] = useState(false)
  const [plotDetailData, setPlotDetailData] =
    useState<PlotDetailResponse | null>(null)
  const [characterDetailOpen, setCharacterDetailOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  )
  const [changeProfileSheetOpen, setChangeProfileSheetOpen] = useState(false)
  const [changeProfileList, setChangeProfileList] = useState<UserChatProfile[]>(
    []
  )
  const [changePlotProfiles, setChangePlotProfiles] = useState<
    PlotProfileItem[]
  >([])
  const [changeProfileLoading, setChangeProfileLoading] = useState(false)
  const [changeProfileInitialId, setChangeProfileInitialId] = useState<
    string | null
  >(null)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  const plotDetailDataRef = useRef(plotDetailData)
  plotDetailDataRef.current = plotDetailData

  const handleCharacterClick = useCallback(
    (character: Character) => {
      setSelectedCharacter(character)
      setCharacterDetailOpen(true)
    },
    [setCharacterDetailOpen]
  )

  const handleAvatarTap = useCallback(
    async (characterName: string) => {
      const character = characters.find((c) => c.name === characterName)
      if (!character) return
      setSelectedCharacter(character)
      setCharacterDetailOpen(true)
    },
    [characters]
  )

  const handleUserMessageTap = useCallback(() => {
    // No-op for now - can be extended to show user profile
  }, [])

  const handleChangeProfile = useCallback(async () => {
    if (!roomId) return
    setChangeProfileLoading(true)
    try {
      const profData = await getUserChatProfiles(50)
      const profiles = profData.chatUserProfiles || profData.userChatProfiles || []
      setChangeProfileList(profiles)
      persistDefaultProfileName(profiles)

      // Determine currently active profile ID
      try {
        const currentProfile = await getMyPlotChatProfile(roomId)
        if (currentProfile.plotChatProfile?.id) {
          setChangeProfileInitialId(currentProfile.plotChatProfile.id)
        } else {
          const matched = (profData.chatUserProfiles || profData.userChatProfiles || []).find(
            (p) => p.selected || p.isDefault
          )
          if (matched) setChangeProfileInitialId(matched.id)
        }
      } catch {
        /* ignore — auto-selection fallback */
      }

      setChangeProfileSheetOpen(true)
    } catch (e: unknown) {
      toast.error(
        `プロフィール取得失敗: ${e instanceof Error ? e.message : String(e)}`
      )
    } finally {
      setChangeProfileLoading(false)
    }
  }, [roomId, plotId])

  const handleChangeProfileSelect = useCallback(
    async (profile: UserChatProfile) => {
      if (!roomId) return
      try {
        await selectUserChatProfile(roomId, profile.id)
        toast.success(`「${profile.name || profile.userAlias}」に変更しました`)
        setChangeProfileSheetOpen(false)
      } catch (e: unknown) {
        toast.error(
          `プロフィール変更失敗: ${e instanceof Error ? e.message : String(e)}`
        )
      }
    },
    [roomId, plotId]
  )

  const handleChangePlotProfileSelect = useCallback(
    async (profile: PlotProfileItem) => {
      if (!roomId || !plotId) return
      try {
        await selectPlotChatProfile(roomId, profile.id)
        toast.success(`「${profile.name}」に変更しました`)
        setChangeProfileSheetOpen(false)
      } catch (e: unknown) {
        toast.error(
          `プロフィール変更失敗: ${e instanceof Error ? e.message : String(e)}`
        )
      }
    },
    [roomId, plotId]
  )

  const handleCreateChangeProfile = useCallback(
    async (profile: UserChatProfile) => {
      await handleChangeProfileSelect(profile)
    },
    [handleChangeProfileSelect]
  )

  const handleHeaderClick = useCallback(async () => {
    if (!roomId) return
    try {
      const currentPlotId = plotId || ""
      if (!currentPlotId) {
        toast.error("プロット情報が見つかりません")
        return
      }

      const currentDetail = plotDetailDataRef.current
      if (!currentDetail || currentDetail.id !== currentPlotId) {
        const data = await getPlot(currentPlotId)
        setPlotDetailData(data as unknown as PlotDetailResponse)
      }
      setPlotDetailOpen(true)
    } catch (e: unknown) {
      toast.error(
        `プロット情報取得失敗: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }, [roomId, plotId, setPlotId])

  const handleProfileUpdated = useCallback(async () => {
    try {
      const profData = await getUserChatProfiles(50)
      const profiles = profData.chatUserProfiles || profData.userChatProfiles || []
      setChangeProfileList(profiles)
      persistDefaultProfileName(profiles)
    } catch {
      // ignore
    }
  }, [setChangeProfileList])

  return {
    plotDetailOpen,
    setPlotDetailOpen,
    plotDetailData,
    characterDetailOpen,
    setCharacterDetailOpen,
    selectedCharacter,
    changeProfileSheetOpen,
    setChangeProfileSheetOpen,
    changeProfileList,
    changePlotProfiles,
    changeProfileLoading,
    changeProfileInitialId,
    exitConfirmOpen,
    setExitConfirmOpen,
    resetConfirmOpen,
    setResetConfirmOpen,
    handleCharacterClick,
    handleAvatarTap,
    handleUserMessageTap,
    handleChangeProfile,
    handleChangeProfileSelect,
    handleChangePlotProfileSelect,
    handleCreateChangeProfile,
    handleProfileUpdated,
    handleHeaderClick,
  }
}
