import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  initAuth,
  getAuthState as getRawAuthState,
} from "@/lib/auth"

interface AuthState {
  ready: boolean
  authenticated: boolean
  hasAccessToken: boolean
  hasRefreshToken: boolean
  userId: string
  expiresAt: number
  expiresInSeconds: number
  gender: string
}

const AuthContext = createContext<AuthState>({
  ready: false,
  authenticated: false,
  hasAccessToken: false,
  hasRefreshToken: false,
  userId: "",
  expiresAt: 0,
  expiresInSeconds: 0,
  gender: "",
})

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ready: false,
    authenticated: false,
    hasAccessToken: false,
    hasRefreshToken: false,
    userId: "",
    expiresAt: 0,
    expiresInSeconds: 0,
    gender: "",
  })

  useEffect(() => {
    initAuth().then((ok: boolean) => {
      const raw = getRawAuthState()
      setState({
        ready: true,
        authenticated: ok,
        hasAccessToken: raw.hasAccessToken,
        hasRefreshToken: raw.hasRefreshToken,
        userId: raw.userId || "",
        expiresAt: raw.expiresAt,
        expiresInSeconds: raw.expiresInSeconds,
        gender: raw.gender || "",
      })
    })

    const handler = () => {
      const raw = getRawAuthState()
      setState((prev) => ({
        ...prev,
        authenticated: raw.hasAccessToken,
        hasAccessToken: raw.hasAccessToken,
        hasRefreshToken: raw.hasRefreshToken,
        userId: raw.userId || "",
        expiresAt: raw.expiresAt,
        expiresInSeconds: raw.expiresInSeconds,
        gender: raw.gender || "",
      }))
    }

    window.addEventListener("chacha-auth-updated", handler)
    return () => window.removeEventListener("chacha-auth-updated", handler)
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
