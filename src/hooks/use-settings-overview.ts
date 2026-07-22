import { useState } from "react"
import { toast } from "sonner"
import { getSessionOverview } from "@/lib/api"
import type { SessionOverview } from "@/lib/types"

export function useSettingsOverview() {
  const [overview, setOverview] = useState<SessionOverview | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(false)

  const loadOverview = async () => {
    setLoadingOverview(true)
    try {
      setOverview(await getSessionOverview())
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingOverview(false)
    }
  }

  return { overview, loadingOverview, loadOverview }
}
