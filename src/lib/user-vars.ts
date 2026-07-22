// Default talk-profile name <-> `{{user}}` substitution.
//
// The chacha API replaces `{{user}}` inside bot *messages* server-side using the
// active profile's `userAlias`. Client-rendered text (plot title / description /
// character summary) is NOT processed by the server, so we persist the default
// talk-profile name locally and substitute it ourselves — but never inside
// messages (the server already handles those).

const DEFAULT_USER_NAME_KEY = "chat_default_user_name"

export function getDefaultUserName(): string {
  try {
    return localStorage.getItem(DEFAULT_USER_NAME_KEY) || ""
  } catch {
    return ""
  }
}

export function setDefaultUserName(name: string | undefined | null): void {
  try {
    if (name) localStorage.setItem(DEFAULT_USER_NAME_KEY, name)
  } catch {
    // ignore (e.g. private mode / disabled storage)
  }
}

export function replaceUserVars(text: string | null | undefined): string {
  if (!text) return ""
  const name = getDefaultUserName()
  if (!name) return text
  return text.replace(/\{\{user\}\}/g, name)
}

export interface DefaultProfileLike {
  userAlias?: string
  name?: string
  isDefault?: boolean
  selected?: boolean
}

/**
 * Persist the default talk-profile name to localStorage. Picks the profile
 * flagged `selected`/`isDefault`, falling back to the first profile.
 */
export function persistDefaultProfileName(
  profiles: DefaultProfileLike[] | undefined
): void {
  if (!profiles || profiles.length === 0) return
  const def =
    profiles.find((p) => p.selected || p.isDefault) || profiles[0]
  if (def) setDefaultUserName(def.userAlias || def.name)
}
