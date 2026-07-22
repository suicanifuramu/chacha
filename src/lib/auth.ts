// ===== Auth Module =====
// refreshTokenはlocalStorageに保存。accessTokenはsessionStorageにも保存。

import { getCommonHeaders } from "./headers"
import { logger } from "./log"

const ACCESS_TOKEN_KEY = "chacha_access_token"
const REFRESH_TOKEN_KEY = "chacha_refresh_token"
const GENDER_KEY = "chacha_gender"

const FIREBASE_BASE = "https://securetoken.googleapis.com/v1/token"
const FIREBASE_API_KEY = "AIzaSyB32T2cjUOQXd0TMExHiIxAOWtSrmSI7g0"

let accessToken: string | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null
let localAuthLoaded = false
let savedRefreshToken = ""

interface ParsedTokens {
  accessToken?: string
  refreshToken?: string
}

function readJsonToken(input: string): ParsedTokens {
  const text = String(input || "").trim()
  if (!text) return {}

  if (/REFRESH_TOKEN=|TOKEN=/i.test(text)) {
    const values: Record<string, string> = {}
    for (const part of text.split(";")) {
      const [rawKey, ...rawValue] = part.trim().split("=")
      const key = rawKey?.trim()
      const value = rawValue.join("=").trim()
      if (key && value) values[key] = decodeURIComponent(value)
    }
    return {
      accessToken: values.TOKEN || values.token || "",
      refreshToken: values.REFRESH_TOKEN || values.refresh_token || "",
    }
  }

  try {
    const parsed = JSON.parse(text) as {
      accessToken?: string
      access_token?: string
      refreshToken?: string
      refresh_token?: string
    }
    return {
      accessToken: parsed.accessToken || parsed.access_token || "",
      refreshToken: parsed.refreshToken || parsed.refresh_token || "",
    }
  } catch {
    return {}
  }
}

function normalizeBearerToken(token: string): string {
  return String(token || "").trim().replace(/^Bearer\s+/i, "")
}

function saveLocalAuth(): void {
  if (savedRefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, savedRefreshToken)
}

export async function loadLocalAuth(force = false): Promise<void> {
  if (localAuthLoaded && !force) return

  savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || ""
  localAuthLoaded = true
}

function storeRefreshToken(token: string): void {
  const normalized = normalizeBearerToken(token)
  if (normalized) {
    savedRefreshToken = normalized
    saveLocalAuth()
  }
}

function storeAccessToken(token: string): void {
  accessToken = normalizeBearerToken(token)
  if (accessToken) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    saveLocalAuth()
  }
}

function clearRefreshTimer(): void {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = null
}

export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = normalizeBearerToken(token).split(".")[1]
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const pad = base64.length % 4
    if (pad) {
      base64 += "=".repeat(4 - pad)
    }
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getTokenExpiry(token: string): number {
  const payload = decodeJwt(token)
  return payload?.exp ? (payload.exp as number) * 1000 : 0
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string {
  return savedRefreshToken
}

export function getGender(): string {
  return localStorage.getItem(GENDER_KEY) || ""
}

export function setGender(gender: string): void {
  const normalized = String(gender || "").trim().toUpperCase()
  if (normalized) {
    localStorage.setItem(GENDER_KEY, normalized)
  } else {
    localStorage.removeItem(GENDER_KEY)
  }
}

export function clearGender(): void {
  localStorage.removeItem(GENDER_KEY)
}

export function updateRefreshToken(token: string): void {
  const parsed = readJsonToken(token)
  storeRefreshToken(parsed.refreshToken || token)
}

export function updateAccessToken(token: string): void {
  const parsed = readJsonToken(token)
  storeAccessToken(parsed.accessToken || token)
  scheduleRefresh()
}

export function importTokens(input: string): void {
  const parsed = readJsonToken(input)
  if (parsed.refreshToken) storeRefreshToken(parsed.refreshToken)
  if (parsed.accessToken) storeAccessToken(parsed.accessToken)
  if (!parsed.refreshToken && !parsed.accessToken) {
    const token = normalizeBearerToken(input)
    if (token.split(".").length === 3) storeAccessToken(token)
    else storeRefreshToken(token)
  }
  scheduleRefresh()
}

export interface AuthState {
  hasAccessToken: boolean
  hasRefreshToken: boolean
  expiresAt: number
  expiresInSeconds: number
  userId: string
  gender: string
  timezone: string
}

export function getAuthState(): AuthState {
  const payload = decodeJwt(accessToken || "")
  const expiresAt = getTokenExpiry(accessToken || "")
  return {
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(savedRefreshToken),
    expiresAt,
    expiresInSeconds: expiresAt
      ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      : 0,
    userId: (payload?.user_id || payload?.sub || "") as string,
    gender: getGender(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

let refreshPromise: Promise<string> | null = null

export async function refreshSession(forceNetwork = false): Promise<string> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const oldToken = accessToken
      await loadLocalAuth(true)

      if (
        accessToken !== oldToken &&
        accessToken &&
        getTokenExpiry(accessToken) > Date.now() + 600000
      ) {
        logger.debug("[Auth] Token was updated from local auth")
        scheduleRefresh()
        window.dispatchEvent(
          new CustomEvent("chacha-auth-updated", {
            detail: getAuthState(),
          })
        )
        return accessToken
      }

      if (
        !forceNetwork &&
        accessToken &&
        getTokenExpiry(accessToken) > Date.now() + 600000
      ) {
        logger.debug("[Auth] Token was already refreshed by another process")
        scheduleRefresh()
        window.dispatchEvent(
          new CustomEvent("chacha-auth-updated", {
            detail: getAuthState(),
          })
        )
        return accessToken
      }

      const refreshToken = savedRefreshToken
      if (!refreshToken) throw new Error("Refresh Token is not set")

      const res = await fetch(`${FIREBASE_BASE}?key=${FIREBASE_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
      })

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearSession()
        }
        throw new Error(`Session refresh failed (${res.status})`)
      }

      const data = (await res.json()) as {
        access_token?: string
        refresh_token?: string
      }
      if (!data.access_token) throw new Error("access_token is missing in response")

      storeAccessToken(data.access_token)
      if (data.refresh_token) storeRefreshToken(data.refresh_token)
      scheduleRefresh()
      window.dispatchEvent(
        new CustomEvent("chacha-auth-updated", {
          detail: getAuthState(),
        })
      )
      return accessToken!
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export async function ensureAccessToken(): Promise<string | null> {
  if (accessToken && getTokenExpiry(accessToken) > Date.now() + 30000) {
    return accessToken
  }
  return refreshSession()
}

function scheduleRefresh(): void {
  clearRefreshTimer()
  if (!accessToken || !savedRefreshToken) return

  const expiry = getTokenExpiry(accessToken)
  if (!expiry) return

  const delay = Math.max(expiry - Date.now() - 600000, 10000)
  refreshTimer = setTimeout(async () => {
    try {
      await refreshSession()
      logger.debug("[Auth] Token auto-refreshed")
    } catch (e) {
      console.error("[Auth] Auto-refresh failed:", e)
      window.dispatchEvent(
        new CustomEvent("chacha-auth-error", {
          detail: e instanceof Error ? e.message : String(e),
        })
      )
    }
  }, delay)
}

export async function initAuth(): Promise<boolean> {
  await loadLocalAuth()

  const cachedAccessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (
    cachedAccessToken &&
    getTokenExpiry(cachedAccessToken) > Date.now() + 30000
  ) {
    accessToken = cachedAccessToken
    scheduleRefresh()
    return true
  }

  if (!savedRefreshToken) return false

  try {
    await refreshSession()
    return true
  } catch (e) {
    console.error("[Auth] Init failed:", e)
    return false
  }
}

export async function clearSession(): Promise<void> {
  clearRefreshTimer()
  accessToken = null
  savedRefreshToken = ""
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  clearGender()
  window.dispatchEvent(
    new CustomEvent("chacha-auth-updated", { detail: getAuthState() })
  )
}
