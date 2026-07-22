import { useRef, useEffect, useCallback } from "react"

export interface UseChatBodyLockReturn {
  preventTouchMoveRef: React.MutableRefObject<((e: TouchEvent) => void) | null>
  releaseBodyLock: () => void
}

export function useChatBodyLock(): UseChatBodyLockReturn {
  const preventTouchMoveRef = useRef<((e: TouchEvent) => void) | null>(null)

  // Lock body scroll to prevent iOS Safari "black space" bouncing
  useEffect(() => {
    document.documentElement.classList.add("chat-locked")
    document.body.classList.add("chat-locked")

    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest("[data-radix-scroll-area-viewport]") ||
        target.closest(".touch-scrollable") ||
        target.closest("[data-vaul-drawer]")
      ) {
        return
      }

      if (target.tagName === "TEXTAREA") {
        const ta = target as HTMLTextAreaElement
        if (ta.scrollHeight <= ta.clientHeight) {
          if (e.cancelable) e.preventDefault()
        }
        return
      }

      if (e.cancelable) e.preventDefault()
    }
    preventTouchMoveRef.current = preventTouchMove
    document.addEventListener("touchmove", preventTouchMove, { passive: false })

    return () => {
      document.documentElement.classList.remove("chat-locked")
      document.body.classList.remove("chat-locked")
      document.removeEventListener("touchmove", preventTouchMove)
      preventTouchMoveRef.current = null
      void document.body.offsetHeight
      window.scrollTo(0, 0)
    }
  }, [])

  const releaseBodyLock = useCallback(() => {
    document.documentElement.classList.remove("chat-locked")
    document.body.classList.remove("chat-locked")
    if (preventTouchMoveRef.current) {
      const currentPreventTouchMove = preventTouchMoveRef.current
      document.removeEventListener("touchmove", currentPreventTouchMove)
    }
    void document.body.offsetHeight
    window.scrollTo(0, 0)
  }, [])

  return {
    preventTouchMoveRef,
    releaseBodyLock,
  }
}
