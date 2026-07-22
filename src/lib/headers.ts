import { APP_VERSION as BUILD_VERSION } from "./version"
import { logger } from "@/lib/log"

// Runtime-mutable — starts at build-time value, auto-updated on APP_UPDATE_REQUIRED
export let APP_VERSION = BUILD_VERSION

export function setAppVersion(v: string) {
  APP_VERSION = v
  logger.debug(`[headers] Version updated: ${BUILD_VERSION} → ${v}`)
}

export function getCommonHeaders() {
  return {
    accept: "application/json, text/plain, */*",
    "x-anirole-app-version": APP_VERSION,
    "x-anirole-client-type": "mobile-app",
    "x-anirole-platform": "android",
    "x-anirole-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo",
    "User-Agent": "okhttp/4.12.0",
  }
}
