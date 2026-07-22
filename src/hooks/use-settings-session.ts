import { useState } from "react"
import { toast } from "sonner"
import {
  clearSession,
  getAuthState,
  getRefreshToken,
  importTokens,
  refreshSession,
  setGender,
} from "@/lib/auth"
import { getUser } from "@/lib/api"

export function useSettingsSession() {
  const [refreshToken, setRefreshToken] = useState(getRefreshToken())
  const [refreshing, setRefreshing] = useState(false)

  const handleRefreshSession = async () => {
    setRefreshing(true)
    try {
      if (refreshToken) importTokens(refreshToken)
      await refreshSession()
      setRefreshToken(getRefreshToken())
      const profile = await getUser()
      setGender(profile.user.gender || "unknown")
      toast.success("セッションを更新しました")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e))
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = async () => {
    await clearSession()
    setRefreshToken("")
    toast.info("ローカルセッションを削除しました")
  }

  const authState = getAuthState()

  return {
    refreshToken,
    setRefreshToken,
    refreshing,
    handleRefreshSession,
    handleLogout,
    authState,
  }
}
