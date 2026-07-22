import { useCallback, useMemo, useRef } from "react"

export function useLongPress(
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void,
  onClick?: (e: React.MouseEvent) => void,
  delay = 500
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClickRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      suppressClickRef.current = false
      clear()
      timerRef.current = setTimeout(() => {
        suppressClickRef.current = true
        onLongPress(e)
      }, delay)
    },
    [onLongPress, delay, clear]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      clear()
      if (suppressClickRef.current) {
        suppressClickRef.current = false
        e.preventDefault()
        e.stopPropagation()
        return
      }
      onClick?.(e)
    },
    [onClick, clear]
  )

  return useMemo(
    () => ({
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: clear,
      onTouchStart: start,
      onTouchEnd: clear,
      onTouchMove: clear,
      onClick: handleClick,
    }),
    [start, clear, handleClick]
  )
}
