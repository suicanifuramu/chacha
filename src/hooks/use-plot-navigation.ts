import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { getActiveRoomId } from "@/lib/api"
import { startNewChat } from "@/lib/new-chat"
import type { Plot } from "@/lib/types"

export interface UsePlotNavigationReturn {
  dialogPlot: Plot | null
  dialogOpen: boolean
  setDialogOpen: (v: boolean) => void
  handlePlotClick: (plot: Plot) => Promise<void>
  handleStartChat: (plot: Plot) => Promise<void>
}

export function usePlotNavigation(): UsePlotNavigationReturn {
  const navigate = useNavigate()
  const [dialogPlot, setDialogPlot] = useState<Plot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handlePlotClick = useCallback(async (plot: Plot) => {
    try {
      const data = await getActiveRoomId(plot.id)
       if (data.roomId) {
        sessionStorage.setItem("chat_plot_name", plot.name || "")
        sessionStorage.setItem("chat_plot_img", plot.imageUrl || "")
        sessionStorage.setItem("chat_plot_id", plot.id)
        navigate(`/chat/${data.roomId}`)
      } else {
        setDialogPlot(plot)
        setDialogOpen(true)
      }
    } catch {
      setDialogPlot(plot)
      setDialogOpen(true)
    }
  }, [navigate])

  const handleStartChat = useCallback(async (plot: Plot) => {
    sessionStorage.setItem("chat_plot_id", plot.id)
    setDialogOpen(false)
    await startNewChat(plot.id, navigate)
  }, [navigate])

  return {
    dialogPlot,
    dialogOpen,
    setDialogOpen,
    handlePlotClick,
    handleStartChat,
  }
}
