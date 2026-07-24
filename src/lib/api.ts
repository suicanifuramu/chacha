import {
  ensureAccessToken,
  getAccessToken,
  getGender,
  refreshSession,
} from "./auth"
import { getCommonHeaders, setAppVersion, APP_VERSION } from "./headers"
import { z } from "zod"
import {
  ImageUploadResponseSchema,
  UserChatProfileSchema,
} from "./schemas"
import type {
  ApiHomeResponse,
  ApiMessagesResponse,
  ApiRankingResponse,
  ApiRoomsResponse,
  Bot,
  CandidatesResponse,
  ChachaUserProfile,
  CreateRoomApiResponse,
  DeleteMessagesResponse,
  DeleteRoomResponse,
  ImageUploadResponse,
  PlotDetailResponse,
  RecommendedResponse,
  RecommendQuotaResponse,
  RoomCheckResponse,
  RuntimeMessage,
  SelectCandidateResponse,
  SmartReplyQuotaResponse,
  SmartReplyResponse,
  UserChatProfile,
  UserChatProfilesResponse,
  UserProfilesListResponse,
  PlotChatProfile,
  SessionOverview,
} from "./types"
import type { IntroMessage } from "./types"

const BASE = "/api/v3"
const CDN_PROXY = "/cdn/unsafe/plain/"
const GCS_BUCKET = "https://storage.googleapis.com/input-image-bucket-9ef5cbe3"

export function imageIdToUrl(id: string): string {
  return `${GCS_BUCKET}/${id}.jpg`
}

export function proxyImage(url: string | null | undefined): string {
  if (!url) return ""
  if (url.startsWith("https://cdn.anirole.com/")) return url
  if (url.startsWith(CDN_PROXY)) return url
  return `${CDN_PROXY}${encodeURIComponent(url)}`
}

function buildHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const token = getAccessToken()
  return {
    ...getCommonHeaders(),
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { headers?: Record<string, string> } = {},
  retry = true,
  versionRetry = true
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: buildHeaders(options.headers || {}),
  })

  if (res.status === 401 && retry) {
    await refreshSession(true)
    return request<T>(path, options, false, versionRetry)
  }

  if (res.status === 400 && versionRetry) {
    const text = await res.text().catch(() => "")
    try {
      const body = JSON.parse(text) as {
        code?: string
        data?: string | Record<string, unknown>
      }
      if (body.code === "APP_UPDATE_REQUIRED") {
        const raw =
          typeof body.data === "string"
            ? JSON.parse(body.data)
            : (body.data || {})
        const minVersion = (raw as { minimumRequiredVersion?: string }).minimumRequiredVersion
        if (minVersion && minVersion !== APP_VERSION) {
          setAppVersion(minVersion)
          return request<T>(path, options, retry, false)
        }
      }
    } catch {
      // ignore
    }
    throw new Error(
      `${options.method || "GET"} ${path} -> 400: ${text.slice(0, 160)}`
    )
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(
      `${options.method || "GET"} ${path} -> ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}`
    )
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

async function get<T>(path: string): Promise<T> {
  await ensureAccessToken()
  return request<T>(path)
}

function validate(
  schema: z.ZodTypeAny,
  data: unknown,
  endpoint: string
): unknown {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.warn(
      `[api] ${endpoint} response shape mismatch`,
      result.error.issues.slice(0, 3)
    )
    throw new Error(`Invalid response shape for ${endpoint}`)
  }
  return result.data
}

async function post<T>(path: string, body: unknown = null): Promise<T> {
  await ensureAccessToken()
  const opts: RequestInit & { headers: Record<string, string> } = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }
  if (body) opts.body = JSON.stringify(body)
  return request<T>(path, opts)
}

async function del<T>(path: string, body: unknown = null): Promise<T> {
  await ensureAccessToken()
  const opts: RequestInit & { headers: Record<string, string> } = {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  }
  if (body) opts.body = JSON.stringify(body)
  return request<T>(path, opts)
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  await ensureAccessToken()
  return request<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ===== Room check (compat) =====
export function getActiveRoomId(
  _botId: string
): Promise<{ roomId: string | null }> {
  // Check sessionStorage for a previously active room
  const storedPlotId = sessionStorage.getItem("chat_plot_id")
  const storedRoomId = sessionStorage.getItem("chat_room_id")
  if (storedPlotId === _botId && storedRoomId) {
    return Promise.resolve({ roomId: storedRoomId })
  }
  return Promise.resolve({ roomId: null })
}

// ===== Bot → Plot マッピング =====
export function botToPlot(bot: Bot): import("./types").Plot {
  return {
    id: bot.id,
    name: bot.name || bot.title || "無題",
    imageUrl: proxyImage(bot.thumbnailImage?.url),
    shortDescription: bot.description || undefined,
    interactionCount: bot.messagesCount || 0,
    hashtags: bot.tags?.map((t) => t.name) || [],
  }
}

// ===== Home =====
export function getHomePlots(
  limit = 20,
  cursor = ""
): Promise<ApiHomeResponse> {
  return get<ApiHomeResponse>(
    `/chat/bots/recommended/v2?fields=isLiked,tags&user_id=*&limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`
  )
}

// ===== Rankings =====
export function getDailyRanking(limit = 20): Promise<ApiRankingResponse> {
  const gender = getGender() || "MALE"
  return get<ApiRankingResponse>(
    `/chat/bots/daily-ranking?fields=isLiked,tags&user_id=*&gender=${gender}&limit=${limit}`
  )
}

export function getWeeklyRanking(limit = 20): Promise<ApiRankingResponse> {
  const gender = getGender() || "MALE"
  return get<ApiRankingResponse>(
    `/chat/bots/weekly-ranking?fields=isLiked,tags&user_id=*&gender=${gender}&limit=${limit}`
  )
}

export function getMonthlyRanking(limit = 20): Promise<ApiRankingResponse> {
  const gender = getGender() || "MALE"
  return get<ApiRankingResponse>(
    `/chat/bots/monthly-ranking?fields=isLiked,tags&user_id=*&gender=${gender}&limit=${limit}`
  )
}

// ===== User =====
export function getMyProfile(): Promise<{ user: ChachaUserProfile }> {
  return get<{ user: ChachaUserProfile }>("/user")
}

export function getUser(): Promise<{ user: ChachaUserProfile }> {
  return get<{ user: ChachaUserProfile }>("/user")
}

// ===== Plot / Bot Detail =====
export function getPlot(plotId: string): Promise<Bot> {
  return get<{ bot: Bot }>(
    `/chat/bots/${plotId}?fields=isLiked,tags`
  ).then((r) => r.bot)
}

// ===== Rooms =====
export function getRoomByBotId(botId: string): Promise<RoomCheckResponse> {
  return get<RoomCheckResponse>(`/chat/bots/${botId}/room`)
}

export function getRooms(limit = 30): Promise<ApiRoomsResponse> {
  return get<ApiRoomsResponse>(
    `/chat/bots/latest?fields=lastMessage&limit=${limit}`
  )
}

export function createRoom(
  botId: string,
  userProfileId?: string
): Promise<CreateRoomApiResponse> {
  return post<CreateRoomApiResponse>("/chat/rooms", {
    botId,
    ...(userProfileId ? { userProfileId } : {}),
  })
}

export function startRoom(
  roomId: string,
  userProfileId: string
): Promise<unknown> {
  return post<unknown>(`/chat/rooms/${roomId}/start`, { userProfileId })
}

export function deleteRoom(roomId: string): Promise<DeleteRoomResponse> {
  return del<DeleteRoomResponse>(`/chat/rooms/${roomId}`)
}

export function leaveBotRooms(botId: string): Promise<{ ok: boolean; deletedCount: number }> {
  return del<{ ok: boolean; deletedCount: number }>(`/chat/bots/${botId}/rooms`)
}

// ===== Messages =====
export function getMessages(
  roomId: string,
  limit = 20
): Promise<ApiMessagesResponse> {
  return get<ApiMessagesResponse>(
    `/chat/rooms/${roomId}/messages?limit=${limit}`
  )
}

export function getMessagesByCursor(
  roomId: string,
  cursor: string,
  limit = 20
): Promise<ApiMessagesResponse> {
  return get<ApiMessagesResponse>(
    `/chat/rooms/${roomId}/messages?limit=${limit}&cursor=${encodeURIComponent(cursor)}`
  )
}

// Send message (SSE stream)
export async function sendMessageStream<T = unknown>(
  roomId: string,
  text: string,
  onEvent: (event: T) => void,
  onDone?: () => void,
  retry = true
): Promise<void> {
  await ensureAccessToken()
  // Object-literal Accept/accept keys are case-sensitive and both get appended
  // by Headers (→ "application/json..., text/event-stream"). Use set() to replace.
  const headers = new Headers({
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
    ...getCommonHeaders(),
  })
  headers.set("Accept", "text/event-stream")

  const res = await fetch(`${BASE}/chat/rooms/${roomId}/send-message`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: text,
      experimental_liteMode: true,
    }),
  })

  if (res.status === 401 && retry) {
    await refreshSession(true)
    return sendMessageStream<T>(roomId, text, onEvent, onDone, false)
  }

  if (!res.ok) throw new Error(`Send failed: ${res.status}`)
  await readSSE<T>(res, onEvent, onDone)
}

// Regen: regenerate last bot message via SSE
export async function regenMessageStream<T = unknown>(
  roomId: string,
  onEvent: (event: T) => void,
  onDone?: () => void,
  retry = true
): Promise<void> {
  await ensureAccessToken()
  const headers = new Headers({
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
    ...getCommonHeaders(),
  })
  headers.set("Accept", "text/event-stream")

  const res = await fetch(`${BASE}/chat/rooms/${roomId}/regenerate-message`, {
    method: "POST",
    headers,
    body: JSON.stringify({ experimental_liteMode: true }),
  })

  if (res.status === 401 && retry) {
    await refreshSession(true)
    return regenMessageStream<T>(roomId, onEvent, onDone, false)
  }

  if (!res.ok) throw new Error(`Regen failed: ${res.status}`)
  await readSSE<T>(res, onEvent, onDone)
}

// Get candidates for a message
export function getCandidates(
  roomId: string,
  messageId: string,
  limit = 100
): Promise<CandidatesResponse> {
  return get<CandidatesResponse>(
    `/chat/rooms/${roomId}/messages/${messageId}/candidates?limit=${limit}`
  )
}

// Select a candidate as primary
export function selectCandidate(
  messageId: string,
  candidateId: string
): Promise<SelectCandidateResponse> {
  return patch<SelectCandidateResponse>(`/chat/messages/${messageId}/primary-candidate`, { candidateId })
}

// Edit message (PATCH text)
export function editMessage(
  messageId: string,
  text: string
): Promise<{ success: boolean }> {
  return patch<{ success: boolean }>(`/chat/messages/${messageId}`, { text })
}

// Delete message (chacha: deletes selected message and all after it)
export function deleteMessages(
  roomId: string,
  messageId: string
): Promise<DeleteMessagesResponse> {
  return del<DeleteMessagesResponse>(`/chat/messages/${messageId}`)
}

// ===== Recommended replies =====
export function getSmartReplyQuota(): Promise<SmartReplyQuotaResponse> {
  return get<SmartReplyQuotaResponse>("/chat/smart-reply/remaining-rate-limit")
}

export function getSmartReply(roomId: string): Promise<SmartReplyResponse> {
  return post<SmartReplyResponse>(`/chat/rooms/${roomId}/smart-reply`)
}

// ===== User Chat Profiles =====
export function getUserChatProfiles(
  limit = 20
): Promise<UserChatProfilesResponse> {
  return get<UserChatProfilesResponse>(
    `/chat/user-profiles?limit=${limit}`
  )
}

export async function uploadUserChatProfileImage(
  file: File | Blob
): Promise<ImageUploadResponse> {
  await ensureAccessToken()
  const reader = new FileReader()
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return request<ImageUploadResponse>("/images/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base64Blob: base64,
      type: "USER_UPLOADED_AVATAR",
    }),
  }).then(
    (data) =>
      validate(ImageUploadResponseSchema, data, "uploadUserChatProfileImage") as ImageUploadResponse
  )
}

export function createUserChatProfile({
  userAlias,
  gender,
  persona,
  thumbnailImageId,
  isDefault,
}: {
  userAlias: string
  gender: string
  persona: string
  thumbnailImageId?: string
  isDefault?: boolean
}): Promise<{ chatUserProfile: UserChatProfile }> {
  const body: Record<string, unknown> = { userAlias, gender, persona }
  if (thumbnailImageId) body.thumbnailImageId = thumbnailImageId
  if (isDefault !== undefined) body.isDefault = isDefault
  return post<{ chatUserProfile: UserChatProfile }>("/chat/user-profiles", body)
}

export function updateUserChatProfile(
  profileId: string,
  {
    userAlias,
    gender,
    persona,
    thumbnailImageId,
    isDefault,
  }: {
    userAlias?: string
    gender?: string
    persona?: string
    thumbnailImageId?: string | null
    isDefault?: boolean
  }
): Promise<{ chatUserProfile: UserChatProfile }> {
  const body: Record<string, unknown> = {}
  if (userAlias !== undefined) body.userAlias = userAlias
  if (gender !== undefined) body.gender = gender
  if (persona !== undefined) body.persona = persona
  if (thumbnailImageId !== undefined) body.thumbnailImageId = thumbnailImageId
  if (isDefault !== undefined) body.isDefault = isDefault
  return patch<{ chatUserProfile: UserChatProfile }>(`/chat/user-profiles/${profileId}`, body)
}

export function deleteUserChatProfile(profileId: string): Promise<{ ok: boolean }> {
  return del<{ ok: boolean }>(`/chat/user-profiles/${profileId}`)
}

export function setDefaultUserChatProfile(profileId: string): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>(`/chat/user-profiles/${profileId}/default`, {})
}

// ===== Room compat =====
export function getRoom(roomId: string): Promise<RoomCheckResponse> {
  return get<RoomCheckResponse>(`/chat/rooms/${roomId}`)
}

export function getRoomModelSetting(
  _roomId: string
): Promise<{ model?: string; type?: string } | null> {
  return Promise.resolve(null)
}

export function getIntroBeforeSelection(
  _roomId: string
): Promise<{ conversation?: { messages?: IntroMessage[] } }> {
  return Promise.resolve({})
}

export function createIntro(
  _roomId: string,
  _body: unknown
): Promise<{ ok: boolean }> {
  return Promise.resolve({ ok: true })
}

export function selectUserChatProfile(
  roomId: string,
  profileId: string
): Promise<{ ok: boolean }> {
  return patch<{ ok: boolean }>(`/chat/rooms/${roomId}`, { userProfileId: profileId })
}

export function selectPlotChatProfile(
  _roomId: string,
  _plotProfileId: string
): Promise<{ ok: boolean }> {
  return Promise.resolve({ ok: true })
}

export async function getMyPlotChatProfile(
  roomId: string
): Promise<{ plotChatProfile?: PlotChatProfile }> {
  try {
    const data = await getRoom(roomId)
    if (data.userProfileId) {
      return { plotChatProfile: { id: data.userProfileId, plotId: "", name: "" } }
    }
    return {}
  } catch {
    return {}
  }
}

export function getSessionOverview(): Promise<SessionOverview> {
  return get<SessionOverview>("/user/overview")
}

// ===== SSE Reader =====
// chacha / AI SDK data-stream lines: "0:\"text\"", "f:{...}", "e:{...}", "d:{...}", "8:[...]"
// Emit those as raw prefix strings so consumers can parse by prefix.
// Also support standard SSE "data: ..." JSON for compatibility.
const CHACHA_STREAM_LINE = /^[a-z\d]+:/

function emitSSELine<T>(trimmed: string, onEvent: (event: T) => void): void {
  if (!trimmed || trimmed.startsWith(":")) return

  if (trimmed.startsWith("data:")) {
    const jsonText = trimmed.slice(5).trim()
    if (!jsonText || jsonText === "[DONE]") return
    // data: may wrap a chacha line (data: 0:"x") or pure JSON
    if (CHACHA_STREAM_LINE.test(jsonText)) {
      onEvent(jsonText as unknown as T)
      return
    }
    try {
      onEvent(JSON.parse(jsonText) as T)
    } catch (e) {
      console.warn(
        "[SSE] Failed to parse:",
        jsonText.slice(0, 200),
        (e as Error).message
      )
    }
    return
  }

  if (CHACHA_STREAM_LINE.test(trimmed)) {
    onEvent(trimmed as unknown as T)
  }
}

async function readSSE<T>(
  res: Response,
  onEvent: (event: T) => void,
  onDone?: () => void
): Promise<void> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      emitSSELine(line.trim(), onEvent)
    }
  }

  // Flush trailing line without final newline (often the last 8:[...] metadata)
  if (buffer.trim()) {
    emitSSELine(buffer.trim(), onEvent)
  }

  if (onDone) onDone()
}
