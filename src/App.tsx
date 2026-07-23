import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Suspense, lazy, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { Spinner } from "@/components/ui/spinner"
import { getUserChatProfiles } from "@/lib/api"
import { getDefaultUserName, persistDefaultProfileName } from "@/lib/user-vars"

const HomePage = lazy(() =>
  import("@/pages/home").then((m) => ({ default: m.HomePage }))
)
const RankingPage = lazy(() =>
  import("@/pages/ranking").then((m) => ({ default: m.RankingPage }))
)
const RoomsPage = lazy(() =>
  import("@/pages/rooms").then((m) => ({ default: m.RoomsPage }))
)
const ChatPage = lazy(() =>
  import("@/pages/chat").then((m) => ({ default: m.ChatPage }))
)
const SettingsPage = lazy(() =>
  import("@/pages/settings").then((m) => ({ default: m.SettingsPage }))
)

function PageSpinner() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}

export default function App() {
  const { ready } = useAuth()
  const location = useLocation()

  // Save scroll position before navigation
  useEffect(() => {
    const key = `scroll_${location.pathname}`
    const saveScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY))
    }
    window.addEventListener("scroll", saveScroll, { passive: true })
    return () => window.removeEventListener("scroll", saveScroll)
  }, [location.pathname])

  // Restore scroll position on navigation
  useEffect(() => {
    const key = `scroll_${location.pathname}`
    const saved = sessionStorage.getItem(key)
    if (saved) {
      const y = parseInt(saved, 10)
      if (!isNaN(y)) {
        window.scrollTo(0, y)
      }
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  // Ensure the default talk-profile name is persisted so client-rendered
  // `{{user}}` placeholders (plot title / description) can be substituted.
  useEffect(() => {
    if (!ready || getDefaultUserName()) return
    getUserChatProfiles(1)
      .then((d) =>
        persistDefaultProfileName(
          d.chatUserProfiles || d.userChatProfiles || d.profiles
        )
      )
      .catch(() => {})
  }, [ready])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">接続中…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="chat/:roomId" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
