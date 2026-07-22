import type { ReactNode } from "react"
import type { ContentItem, InfoBoxContent } from "@/lib/types"
import { InfoBox } from "@/components/info-box"
import { MessageBubble } from "@/components/chat/message-bubble"

/**
 * Type guard narrowing a `ContentItem` to `InfoBoxContent`.
 *
 * An InfoBoxContent item represents a wiki-style entry summarizing a character
 * — it lives inside `contents[]` arrays next to streaming messages and is
 * rendered side-by-side with regular bubbles.
 */
export function isInfoBoxContent(item: ContentItem): item is InfoBoxContent {
  return item.type === "INFO_BOX" && Array.isArray(item.characters)
}

export interface RenderContentItemCtx {
  /** Avatar lookup keyed by character/speaker name. */
  charAvatars: Record<string, string>
  /** When true, the user's taps in delete mode are disabled. */
  deleteMode: boolean
  /** When true, long-press on a USER bubble is disabled while streaming. */
  streaming: boolean
  /** Long-pressing a USER (right-aligned) bubble opens the profile-change sheet. */
  onUserMessageTap: () => void
  /** Tapping a character avatar opens their detail sheet. */
  onAvatarTap: (characterName: string) => void
  /**
   * Controls whether the speaker avatar should be shown for RIGHT-positioned
   * items.
   *   - `true`  (regen / current streaming): show avatar whenever `speakerName`
   *     is set, even for RIGHT-positioned items, because streaming output is
   *     still being typed and we want continuous UI feedback.
   *   - `false` (settled post-stream): only show avatar for items whose
   *     `position !== "RIGHT"`, matching the final UX where the user's own
   *     bubble sits without an avatar.
   */
  streamMode: boolean
}

/**
 * Render a single `ContentItem` as `<InfoBox>` or `<MessageBubble>` with a
 * stable React key built from `keyPrefix + index`. Centralizes the three
 * inline patterns previously duplicated in `message-list.tsx` so that any
 * future behavior change (avatar policy, key format, etc.) lives in one
 * place instead of three.
 */
export function renderContentItem(
  c: ContentItem,
  keyPrefix: string,
  index: number,
  ctx: RenderContentItemCtx
): ReactNode {
  const key = `${keyPrefix}${index}`

  if (isInfoBoxContent(c)) {
    return <InfoBox key={key} data={c} charAvatars={ctx.charAvatars} />
  }

  const showSpeakerAvatar = ctx.streamMode
    ? Boolean(c.speakerName)
    : c.position !== "RIGHT" && Boolean(c.speakerName)

  const avatarUrl =
    showSpeakerAvatar && c.speakerName
      ? ctx.charAvatars[c.speakerName]
      : undefined

  return (
    <MessageBubble
      key={key}
      content={c}
      avatarUrl={avatarUrl}
      onAvatarTap={() => {
        if (showSpeakerAvatar && c.speakerName) {
          ctx.onAvatarTap(c.speakerName)
        }
      }}
      onUserMessageTap={
        ctx.deleteMode || ctx.streaming ? undefined : ctx.onUserMessageTap
      }
    />
  )
}
