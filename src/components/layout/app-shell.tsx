import { Outlet } from "react-router-dom"
import { BottomNav } from "./bottom-nav"

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
