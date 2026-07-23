import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  createUserChatProfile,
  deleteUserChatProfile,
  getUserChatProfiles,
  setDefaultUserChatProfile,
  updateUserChatProfile,
} from "@/lib/api"
import type { UserChatProfile } from "@/lib/types"
import { persistDefaultProfileName } from "@/lib/user-vars"

export function useSettingsProfiles() {
  const [profiles, setProfiles] = useState<UserChatProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [editId, setEditId] = useState("")
  const [profileName, setProfileName] = useState("")
  const [profileGender, setProfileGender] = useState("MALE")
  const [profileDesc, setProfileDesc] = useState("")
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [profileIsDefault, setProfileIsDefault] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [isFormDirty, setIsFormDirty] = useState(false)

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isFormDirty])

  const loadProfiles = async () => {
    setLoadingProfiles(true)
    try {
      const data = await getUserChatProfiles(50)
      const list = data.chatUserProfiles || data.profiles || []
      setProfiles(Array.isArray(list) ? list : [])
      persistDefaultProfileName(list)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingProfiles(false)
    }
  }

  const resetForm = () => {
    setEditId("")
    setProfileName("")
    setProfileGender("MALE")
    setProfileDesc("")
    setProfileImageUrl("")
    setProfileIsDefault(false)
    setIsFormDirty(false)
  }

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast.error("名前を入力してください")
      return
    }
    setProfileSaving(true)
    try {
      if (editId) {
        await updateUserChatProfile(editId, {
          userAlias: profileName,
          gender: profileGender,
          persona: profileDesc,
          thumbnailImageId: profileImageUrl || undefined,
          isDefault: profileIsDefault,
        })
        toast.success("プロフィールを更新しました")
      } else {
        await createUserChatProfile({
          userAlias: profileName,
          gender: profileGender,
          persona: profileDesc,
          thumbnailImageId: profileImageUrl || undefined,
          isDefault: profileIsDefault,
        })
        toast.success("プロフィールを作成しました")
      }
      resetForm()
      await loadProfiles()
    } catch (e: unknown) {
      toast.error(
        `${editId ? "更新" : "作成"}失敗: ${e instanceof Error ? e.message : String(e)}`
      )
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultUserChatProfile(id)
      toast.success("デフォルトに設定しました")
      await loadProfiles()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか?`)) return
    try {
      await deleteUserChatProfile(id)
      toast.success("削除しました")
      await loadProfiles()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e))
    }
  }

   const handleEdit = (profile: UserChatProfile) => {
    setEditId(profile.id)
    setProfileName(profile.userAlias || profile.name || "")
    setProfileGender(profile.gender || "MALE")
    setProfileDesc(profile.persona || profile.description || "")
    setProfileImageUrl(profile.profileImageUrl || "")
    setProfileIsDefault(profile.isDefault || profile.selected || false)
    setIsFormDirty(false)
  }

  return {
    profiles,
    loadingProfiles,
    loadProfiles,
    editId,
    profileName,
    setProfileName,
    profileGender,
    setProfileGender,
    profileDesc,
    setProfileDesc,
    profileImageUrl,
    setProfileImageUrl,
    profileIsDefault,
    setProfileIsDefault,
     profileSaving,
    handleSaveProfile,
    handleSetDefault,
    handleDelete,
    handleEdit,
    resetForm,
    isFormDirty,
    setIsFormDirty,
  }
}
