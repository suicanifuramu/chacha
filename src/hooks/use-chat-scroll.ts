import { useCallback, useEffect, useRef, useState } from "react"

export function useChatScroll({
  roomId,
  loading,
  messagesLength,
  regenMsgId,
  loadOlderMessagesRef,
}: {
  roomId: string | undefined
  loading: boolean
  messagesLength: number
  regenMsgId: string | null
  loadOlderMessagesRef: React.MutableRefObject<(() => Promise<void>) | undefined>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const initialLoadDone = useRef(false)
  const prevRegenMsgIdRef = useRef<string | null>(null)

  const getViewport = useCallback(() => {
    const el = scrollRef.current
    if (!el) return null
    return el.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null
  }, [])

  // Track scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const viewport = getViewport()
    if (!viewport) return

    const handleScroll = () => {
      const isNearBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 150
      setShowScrollBottom(!isNearBottom)
    }

    viewport.addEventListener("scroll", handleScroll, { passive: true })
    const resizeObserver = new ResizeObserver(() => handleScroll())
    if (viewport.firstElementChild) {
      resizeObserver.observe(viewport.firstElementChild)
    }
    handleScroll()

    return () => {
      const currentViewport = viewport
      currentViewport.removeEventListener("scroll", handleScroll)
      resizeObserver.disconnect()
    }
  }, [getViewport])

  const scrollToBottom = useCallback(() => {
    const doScroll = () => {
      const viewport = getViewport()
      if (viewport) viewport.scrollTop = viewport.scrollHeight
    }
    requestAnimationFrame(() => {
      doScroll()
      setTimeout(doScroll, 100)
      setTimeout(doScroll, 300)
    })
  }, [getViewport])

  const smoothScrollToBottom = useCallback(() => {
    const viewport = getViewport()
    if (!viewport) return

    const start = viewport.scrollTop
    const end = viewport.scrollHeight - viewport.clientHeight
    const distance = end - start

    if (distance <= 0) return

    const duration = Math.min(200 + (distance / 1000) * 100, 500)
    const startTime = performance.now()

    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

    const animateScroll = (currentTime: number) => {
      const currentEnd = viewport.scrollHeight - viewport.clientHeight
      const currentDistance = currentEnd - start

      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      viewport.scrollTop = start + currentDistance * easeOutExpo(progress)

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      } else {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
    requestAnimationFrame(animateScroll)
  }, [getViewport])

  // Visual viewport synchronization for mobile keyboard gaps/overlaps
  useEffect(() => {
    if (!window.visualViewport) return
    let prevVpHeight = window.visualViewport.height
    const containerRefCurrent = containerRef.current
    const updateViewportHeight = () => {
      if (containerRefCurrent && window.visualViewport) {
        const newHeight = window.visualViewport.height
        const offsetTop = window.visualViewport.offsetTop

        containerRefCurrent.style.height = `${newHeight}px`
        containerRefCurrent.style.transform = `translateY(${offsetTop}px)`

        if (prevVpHeight !== newHeight) {
          scrollToBottom()
        }
        prevVpHeight = newHeight
      }
    }
    updateViewportHeight()
    window.visualViewport.addEventListener("resize", updateViewportHeight)
    window.visualViewport.addEventListener("scroll", updateViewportHeight)
    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight)
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight)
      if (containerRefCurrent) {
        containerRefCurrent.style.height = ""
        containerRefCurrent.style.transform = ""
      }
    }
  }, [scrollToBottom])

  // Automatically reset initial load flag on room change
  useEffect(() => {
    initialLoadDone.current = false
  }, [roomId])

  // IntersectionObserver for top sentinel (load older messages)
  useEffect(() => {
    const sentinel = topSentinelRef.current
    const viewport = getViewport()
    if (!sentinel || !viewport || loading) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadOlderMessagesRef.current?.()
      },
      { root: viewport, rootMargin: "200px 0px 0px 0px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, getViewport])

  // Auto-scroll to bottom only on initial load
  useEffect(() => {
    const currentRef = containerRef.current
    if (
      !loading &&
      messagesLength > 0 &&
      !initialLoadDone.current &&
      currentRef
    ) {
      initialLoadDone.current = true
      scrollToBottom()
    }
  }, [loading, messagesLength, scrollToBottom])

  // Auto-scroll to bottom when regen completes
  useEffect(() => {
    if (prevRegenMsgIdRef.current !== null && regenMsgId === null) {
      scrollToBottom()
    }
    prevRegenMsgIdRef.current = regenMsgId
  }, [regenMsgId, scrollToBottom])

  return {
    containerRef,
    scrollRef,
    topSentinelRef,
    scrollToBottom,
    smoothScrollToBottom,
    showScrollBottom,
    getViewport,
  }
}
