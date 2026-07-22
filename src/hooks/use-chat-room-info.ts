import { useState, useEffect } from "react"
import { getPlot, getRoom } from "@/lib/api"
import { proxyImage } from "@/lib/api"
import { preloadImages } from "@/lib/image-preloader"
import type { Character, PlotStatus } from "@/lib/types"
import { replaceUserVars } from "@/lib/user-vars"

export interface UseChatRoomInfoReturn {
  plotName: string
  setPlotName: React.Dispatch<React.SetStateAction<string>>
  plotImg: string
  setPlotImg: React.Dispatch<React.SetStateAction<string>>
  headerSub: string
  setHeaderSub: React.Dispatch<React.SetStateAction<string>>
  charAvatars: Record<string, string>
  setCharAvatars: React.Dispatch<React.SetStateAction<Record<string, string>>>
  characters: Character[]
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
  plotId: string
  setPlotId: React.Dispatch<React.SetStateAction<string>>
  introContent: string
  statuses: PlotStatus[]
}

export function useChatRoomInfo(
  roomId: string | undefined
): UseChatRoomInfoReturn {
  const [plotName, setPlotName] = useState(
    () => sessionStorage.getItem("chat_plot_name") || "チャット"
  )
  const [plotImg, setPlotImg] = useState(
    () => sessionStorage.getItem("chat_plot_img") || ""
  )
  const [headerSub, setHeaderSub] = useState("オンライン")
  const [charAvatars, setCharAvatars] = useState<Record<string, string>>({})
  const [characters, setCharacters] = useState<Character[]>([])
  const [introContent, setIntroContent] = useState("")
  const [plotId, setPlotId] = useState<string>("")
  const [statuses, setStatuses] = useState<PlotStatus[]>([])

  useEffect(() => {
    if (!roomId) return

    // Try to get plotId from sessionStorage first
    const storedPlotId = sessionStorage.getItem("chat_plot_id")
    if (storedPlotId) {
      setPlotId(storedPlotId)
      loadBotDetail(storedPlotId)
      return
    }

    // Fallback: derive the plot (bot) id from the room itself.
    // Covers deep links / new tabs opened directly on /chat/:roomId
    // where sessionStorage.chat_plot_id was never written.
    getRoom(roomId)
      .then((data) => {
        const botId = data.room?.bots?.[0]?.id
        if (botId) {
          setPlotId(botId)
          loadBotDetail(botId)
        }
      })
      .catch(() => {})
  }, [roomId])

  async function loadBotDetail(botId: string) {
    try {
      const bot = await getPlot(botId)
      const chars = bot.characters || []
      const avatars: Record<string, string> = {}
      chars.forEach((c) => {
        const img = proxyImage(c.thumbnailImage?.url)
        if (c.name && img) avatars[c.name] = img
      })
      setCharAvatars(avatars)
      setCharacters(
        chars.map((c) => ({
          id: c.publicId,
          name: c.name,
          imageUrl: proxyImage(c.thumbnailImage?.url),
          description: c.persona || c.description || "",
        }))
      )

      const charImageUrls = chars
        .map((c) => proxyImage(c.thumbnailImage?.url))
        .filter((u): u is string => !!u)
      if (charImageUrls.length > 0) {
        preloadImages(charImageUrls, { priority: "high" }).catch(() => {})
      }

      const name = replaceUserVars(bot.name || "")
      const img = proxyImage(bot.thumbnailImage?.url || null)

      setIntroContent(bot.firstMessage || "")
      setStatuses(bot.statuses || [])

      if (name) {
        setPlotName(name)
        sessionStorage.setItem("chat_plot_name", name)
      }
      if (img) {
        setPlotImg(img)
        sessionStorage.setItem("chat_plot_img", img)
      }
    } catch {
      // ignore
    }
  }

  return {
    plotName,
    setPlotName,
    plotImg,
    setPlotImg,
    headerSub,
    setHeaderSub,
    charAvatars,
    setCharAvatars,
    characters,
    setCharacters,
    plotId,
    setPlotId,
    introContent,
    statuses,
  }
}
