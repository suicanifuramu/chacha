import { ProfileSelectSheet } from "@/components/profile-select-sheet"
import { PlotDetailDialog } from "@/components/plot-detail-dialog"
import { CharacterDetailSheet } from "@/components/character-detail-sheet"
import type { UserChatProfile, Character, PlotDetailResponse } from "@/lib/types"
import type { PlotProfileItem } from "@/components/profile-select-sheet"

interface ChatOverlaysProps {
  plotId: string
  profileSheetOpen: boolean
  setProfileSheetOpen: (v: boolean) => void
  profileList: UserChatProfile[]
  plotChatProfiles: PlotProfileItem[]
  profileLoading: boolean
  handleProfileSelect: (profile: UserChatProfile) => Promise<void>
  handlePlotProfileSelect: (profile: PlotProfileItem) => Promise<void>
  handleCreateProfile: (profile: UserChatProfile) => Promise<void>
  plotDetailData: PlotDetailResponse | null
  plotDetailOpen: boolean
  setPlotDetailOpen: (v: boolean) => void
  selectedCharacter: Character | null
  characterDetailOpen: boolean
  setCharacterDetailOpen: (v: boolean) => void
  changeProfileSheetOpen: boolean
  setChangeProfileSheetOpen: (v: boolean) => void
  changeProfileList: UserChatProfile[]
  changePlotProfiles: PlotProfileItem[]
  changeProfileLoading: boolean
  changeProfileInitialId: string | null
  handleChangeProfileSelect: (profile: UserChatProfile) => Promise<void>
  handleChangePlotProfileSelect: (profile: PlotProfileItem) => Promise<void>
  handleCreateChangeProfile: (profile: UserChatProfile) => Promise<void>
  handleProfileUpdated: () => Promise<void>
  handleChangeProfileUpdated: () => Promise<void>
}

export function ChatOverlays({
  plotId,
  profileSheetOpen,
  setProfileSheetOpen,
  profileList,
  plotChatProfiles,
  profileLoading,
  handleProfileSelect,
  handlePlotProfileSelect,
  handleCreateProfile,
  plotDetailData,
  plotDetailOpen,
  setPlotDetailOpen,
  selectedCharacter,
  characterDetailOpen,
  setCharacterDetailOpen,
  changeProfileSheetOpen,
  setChangeProfileSheetOpen,
  changeProfileList,
  changePlotProfiles,
  changeProfileLoading,
  changeProfileInitialId,
  handleChangeProfileSelect,
  handleChangePlotProfileSelect,
  handleCreateChangeProfile,
  handleProfileUpdated,
  handleChangeProfileUpdated,
}: ChatOverlaysProps) {
  return (
    <>
      <ProfileSelectSheet
        profiles={profileList}
        plotProfiles={plotChatProfiles}
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        onSelect={handleProfileSelect}
        onPlotSelect={handlePlotProfileSelect}
        onCreateProfile={handleCreateProfile}
        onProfileUpdated={handleProfileUpdated}
        loading={profileLoading}
      />

      <ProfileSelectSheet
        variant="change"
        profiles={changeProfileList}
        plotProfiles={changePlotProfiles}
        open={changeProfileSheetOpen}
        onOpenChange={setChangeProfileSheetOpen}
        onSelect={handleChangeProfileSelect}
        onPlotSelect={handleChangePlotProfileSelect}
        onCreateProfile={handleCreateChangeProfile}
        onProfileUpdated={handleChangeProfileUpdated}
        loading={changeProfileLoading}
        initialSelectedId={changeProfileInitialId || undefined}
      />

      <PlotDetailDialog
        plot={plotDetailData}
        open={plotDetailOpen}
        onOpenChange={setPlotDetailOpen}
      />

      <CharacterDetailSheet
        character={selectedCharacter}
        plotId={plotId}
        open={characterDetailOpen}
        onOpenChange={setCharacterDetailOpen}
      />
    </>
  )
}
