import { useState, useCallback } from "react"
import { signInWithPopup } from "firebase/auth"
import { toast } from "sonner"
import { auth, googleProvider } from "@/lib/firebase"
import { importTokens, updateAccessToken, getAuthState } from "@/lib/auth"

export function useGoogleLogin() {
  const [loggingIn, setLoggingIn] = useState(false)

  const login = useCallback(async () => {
    setLoggingIn(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const refreshToken = result.user.refreshToken

      if (refreshToken) importTokens(refreshToken)
      updateAccessToken(idToken)
      window.dispatchEvent(
        new CustomEvent("chacha-auth-updated", {
          detail: getAuthState(),
        })
      )
      toast.success("Googleログインに成功しました")
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        return
      }
      if (err.code === "auth/unauthorized-domain") {
        toast.error(
          "このドメインからのログインは許可されていません"
        )
        return
      }
      toast.error(err.message || "Googleログインに失敗しました")
    } finally {
      setLoggingIn(false)
    }
  }, [])

  return { login, loggingIn }
}