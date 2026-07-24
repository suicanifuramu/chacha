import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CachedAvatarImage } from "@/components/cached-avatar-image"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { getRooms, proxyImage } from "@/lib/api"
import type { Room, Message } from "@/lib/types"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "たった今"
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  return `${Math.floor(h / 24)}日前`
}

function getPreview(lastMessage: Message | undefined) {
  const text = lastMessage?.contents?.[0]?.text || lastMessage?.text || ""
  if (!text) return ""
  return text
    .replace(/@([^\s@]+:)/g, "$1")
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 50)
}

export function RoomsPage() {
  useEffect(() => {
    document.title = "Chacha Chat"
  }, [])

  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRooms(30)
      .then((data) => {
        const bots = data.bots || []
        const rooms: Room[] = bots.map((b) => ({
          id: b.latestRoomId || b.id,
          plot: {
            id: b.id,
            name: b.name || b.title || "無題",
            imageUrl: proxyImage(b.thumbnailImage?.url),
            shortDescription: b.description || undefined,
          },
          title: b.name || b.title || undefined,
          lastMessage: b.lastMessage?.candidates?.[0]?.text
            ? {
                id: b.lastMessage.id,
                roomId: b.latestRoomId || b.id,
                senderId: "",
                text: b.lastMessage.candidates[0].text,
                createdAt: b.lastMessage.createdAt,
                contents: [{ text: b.lastMessage.candidates[0].text }],
              }
            : undefined,
          lastMessageTime: b.lastMessage?.createdAt || b.updatedAt,
        }))
        setRooms(rooms)
      })
      .catch((e: unknown) =>
        toast.error(
          `読み込み失敗: ${e instanceof Error ? e.message : String(e)}`
        )
      )
      .finally(() => setLoading(false))
  }, [])

  const handleClick = (room: Room) => {
    const plot = room.plot
    sessionStorage.setItem("chat_plot_name", plot?.name || room.title || "")
    sessionStorage.setItem("chat_plot_img", plot?.imageUrl || "")
    sessionStorage.setItem("chat_plot_id", plot?.id || "")
    navigate(`/chat/${room.id}`)
  }

  return (
    <div className="animate-fade-in">
      <header className="px-5 pt-[max(18px,env(safe-area-inset-top))] pb-3">
        <h1 className="text-2xl font-bold text-wrap balance">チャット</h1>
      </header>

      <div className="px-5">
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
            <p>チャットルームがありません</p>
            <p className="text-xs">ホームからプロットを選択してチャットを開始しましょう</p>
          </div>
        ) : (
          <div className="flex flex-col overflow-x-hidden">
            {rooms.map((room, i) => {
              const plot = room.plot
              const lastMessage = room.lastMessage
              const preview = getPreview(lastMessage)
              const time = lastMessage?.createdAt ?? room.lastMessageTime
                ? timeAgo(lastMessage?.createdAt ?? room.lastMessageTime!)
                : ""
              return (
                <div key={room.id}>
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-secondary/50"
                    onClick={() => handleClick(room)}
                  >
                    <Avatar className="size-12 flex-shrink-0">
                      <CachedAvatarImage src={plot?.imageUrl} alt={plot?.name} />
                      <AvatarFallback>{(plot?.name || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-medium">
                          {room.title || plot?.name || "チャット"}
                        </span>
                        <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                          {time}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {preview}
                      </p>
                    </div>
                    {(room.unreadCount || 0) > 0 && (
                      <Badge className="ml-1 shrink-0 tabular-nums">
                        {room.unreadCount}
                      </Badge>
                    )}
                  </button>
                  {i < rooms.length - 1 && (
                    <Separator className="ml-17 w-[calc(100%-68px)]" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
