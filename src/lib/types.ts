export interface Plot {
  id: string
  name: string
  imageUrl?: string
  shortDescription?: string
  interactionCount?: number
  hashtags?: string[]
  rank?: number
  rankDiff?: number
  isNew?: boolean
  characters?: Character[]
}

export interface Character {
  id: string
  name: string
  imageUrl?: string
  description?: string
  persona?: string | null
}

export interface Room {
  id: string
  lastMessageTime?: string
  plot?: Plot
  title?: string
  name?: string
  unreadCount?: number
  lastMessage?: Message
  [key: string]: unknown
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  text: string
  createdAt?: string
  candidates?: Candidate[]
  contents?: ContentItem[]
  authorType?: "USER" | "BOT"
}

export interface Candidate {
  id: string
  text: string
  isFinalized?: boolean
  contents?: ContentItem[]
  content?: string
  status?: Record<string, string>
}

export interface InfoBoxItem {
  label: string
  value: string
}

export interface InfoBoxCharacter {
  name: string
  items: InfoBoxItem[]
}

export interface InfoBoxContent {
  type: "INFO_BOX"
  scenes: unknown[]
  characters: InfoBoxCharacter[]
}

export interface UserChatProfile {
  id: string
  userAlias?: string
  name?: string
  description?: string
  persona?: string
  gender?: string
  isDefault?: boolean
  profileImageUrl?: string
  thumbnailImageId?: string | null
  thumbnailImage?: { url: string; id: string } | null
  selected?: boolean
}

export interface SessionOverview {
  profiles: UserChatProfilesResponse | null
  creatorStats?: {
    followingCount: number
    followerCount: number
    plotCount: number
  }
}

export interface ApiListResponse<T> {
  cursor?: string | null
  nextCursor?: string | null
  count?: number
  [key: string]: T[] | string | number | null | undefined | unknown
}

export interface ApiHomeResponse {
  bots?: Bot[]
  count?: number
  nextCursor?: string
}

export interface ApiRankingResponse {
  bots?: Bot[]
}

export interface ApiRoomsResponse {
  bots?: Bot[]
  count?: number
  nextCursor?: string | null
}

export interface ApiMessagesResponse {
  messages?: RuntimeMessage[]
  nextCursor?: string
  hasMore?: boolean
}

// ===== Bot (chacha API) =====
export interface Bot {
  id: string
  user: {
    id: string
    displayName: string
    avatar?: { id: string; url: string } | null
  }
  scope?: string
  isPersonaPublic?: boolean
  persona?: string | null
  name: string
  title: string | null
  description: string | null
  firstMessage?: string
  thumbnailImage?: {
    id: string
    url: string
    contentRating: string
    width: number
    height: number
  } | null
  status?: string
  updatedAt?: string
  createdAt?: string
  userAlias?: string
  messagesCount?: number
  commentCount?: number
  likeCount?: number
  isLiked?: boolean
  contentRating?: string
  tags?: Array<{ id: string; name: string }>
  schemaVersion?: number
  source?: { id: string; label: string; visible: boolean }
  // ranking のみ
  score?: number
  // rooms のみ
  lastMessage?: {
    id: string
    candidates: Array<{ text: string }>
    createdAt: string
  }
  latestRoomId?: string
  // プロット詳細 のみ
  characters?: Array<{
    publicId: string
    name: string
    description: string | null
    persona?: string | null
    isPersonaPublic?: boolean
    thumbnailImage?: { id: string; url: string; contentRating: string; width: number; height: number }
  }>
  statuses?: Array<{
    publicId: string
    key: string
    label: string
    type: string
    defaultValue: string
    config: unknown
    sortOrder: number
  }>
  images?: Array<{
    id: string
    url: string
    sortOrder: number
    contentRating: string
    width: number
    height: number
  }>
}

// ===== User Profile (chacha API) =====
export interface ChachaUserProfile {
  id: string
  email?: string
  imageUrl?: string
  locale?: string
  timezone?: string
  displayName?: string
  gender?: string
  visibleContentRating?: string
  chatProfiles?: UserChatProfile[]
}

// ===== Room check (chacha API) =====
export interface RoomCheckResponse {
  hasRoom: boolean
  mode: string
  longTermMemoryEnabled: boolean
  userProfileId: string | null
  userProfileDeleted: boolean
  initialUserProfileId: string | null
  initialUserProfileDeleted: boolean
  schemaVersion: number
  botId?: string
  roomId?: string
}

// ===== User profiles list (chacha API) =====
export interface UserProfilesListResponse {
  chatUserProfiles: UserChatProfile[]
  nextCursor: string | null
}

// ===== Recommend (chacha API) =====
export interface SmartReplyQuotaResponse {
  max: number
  remaining: number
  reset: number
  creditBalance: number
}

export interface SmartReplyResponse {
  replies: Array<{ category: string; text: string }>
  llmTraceId: string
}

// ===== Image upload (chacha API) =====
export interface ImageUploadResponse {
  id: string
  url: string
}

// ===== Room create (chacha API) =====
export interface CreateRoomApiResponse {
  room: {
    id: string
    title: string | null
    schemaVersion: number
    mode: string
    userId: string
    userProfileId: string | null
    createdAt: string
    updatedAt: string
    bots: Array<{ id: string }>
  }
}

// ===== Legacy compatibility types =====
export interface PlotDetailResponse extends Plot {
  longDescription?: string
  initialRoomImageUrl?: string
  creator?: {
    id: string
    nickname: string
    username: string
  }
  intros?: IntroItem[]
  isAboutPublic?: boolean
  about?: {
    contents: Array<{
      content?: string
      text?: string
    }>
    characters: Array<{
      characterId: string
      description: string
    }>
  }
  chatProfiles?: PlotChatProfile[]
}

export interface PlotChatProfile {
  id: string
  plotId: string
  name: string
  imageUrl?: string
  summary?: string
  description?: string
  isUsingDefaultName?: boolean
}

export interface TextIntroMessage {
  type?: "text"
  senderId: string | null
  content: string
  position?: string
}

export interface ImageIntroMessage {
  type: "image"
  id: string
  url: string
  caption?: string
  aspectRatio?: number
  fileName?: string
}

export type IntroMessage = TextIntroMessage | ImageIntroMessage

export interface IntroConversation {
  messages: IntroMessage[]
}

export interface IntroItem {
  conversation?: IntroConversation
}

export interface ContentItem {
  type?: string
  position?: string
  speakerName?: string
  text?: string
  scenes?: unknown[]
  characters?: InfoBoxCharacter[]
}

export interface RuntimeMessage extends Message {
  contents?: ContentItem[]
  candidateId?: string
  isIntro?: boolean
  sender?: { type: string }
}

export interface DeleteMessagesResponse {
  success: boolean
}

export interface DeleteRoomResponse {
  ok: boolean
  deletedCount?: number
}

export interface RecommendedResponse {
  replies?: Array<{ category: string; text: string }>
  llmTraceId?: string
}

export interface RecommendQuotaResponse {
  max?: number
  remaining?: number
  reset?: number
  creditBalance?: number
}

export interface MyProfileResponse {
  id: string
  name?: string
  email?: string
  nickname?: string
  username?: string
  profileImageUrl?: string | null
  description?: string
  gender: string
  timeZone?: string
  birthdate?: string
  language?: string
  isAnonymous?: boolean
  createdAt?: string
}

// Profiles
export interface UserChatProfilesResponse {
  chatUserProfiles?: UserChatProfile[]
  userChatProfiles?: UserChatProfile[]
  profiles?: UserChatProfile[]
  cursor?: string
  nextCursor?: string
}

// Plot detail characters (chacha)
export interface PlotCharacter {
  publicId: string
  name: string
  description: string
  thumbnailImage?: { url: string }
}

export interface PlotStatus {
  publicId: string
  key: string
  label: string
  type: string
  defaultValue: string
  sortOrder: number
  config: unknown | null
}
