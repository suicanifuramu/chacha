"use client"

import { useState, useCallback, useRef } from "react"
import { CachedImage } from "@/components/cached-image"
import { Skeleton } from "@/components/ui/skeleton"

interface CharacterImageCarouselProps {
  images: Array<{ imageUrl: string; aspectRatio: number }>
  index: number
  onIndexChange?: (index: number) => void
}

export function CharacterImageCarousel({
  images,
  index,
  onIndexChange,
}: CharacterImageCarouselProps) {
  const [scale, setScale] = useState(1)
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set())
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchState = useRef<{
    startX: number
    startY: number
    isSwiping: boolean
    isPanning: boolean
  } | null>(null)

  const minScale = 1
  const maxScale = 4

  const total = images.length
  const displayImages =
    total > 1 ? [images[total - 1], ...images, images[0]] : images

  const displayCount = displayImages.length

  const realToDisplay = useCallback(
    (realIdx: number) => (total > 1 ? realIdx + 1 : realIdx),
    [total]
  )
  const displayToReal = useCallback(
    (displayIdx: number) => {
      if (displayIdx === 0) return total - 1
      if (displayIdx === displayCount - 1) return 0
      return displayIdx - 1
    },
    [total, displayCount]
  )

  const [prevIndex, setPrevIndex] = useState(index)
  const [navigatedIndex, setNavigatedIndex] = useState(() =>
    realToDisplay(index)
  )

  if (prevIndex !== index) {
    setPrevIndex(index)
    if (!isTransitioning) {
      setNavigatedIndex(realToDisplay(index))
      setScale(1)
    }
  }

  const [prevImages, setPrevImages] = useState(images)
  if (prevImages !== images) {
    setPrevImages(images)
    setLoadedUrls(new Set())
  }

  const displayIndex = isTransitioning ? navigatedIndex : realToDisplay(index)

  const handleImageLoad = useCallback((url: string) => {
    setLoadedUrls((prev) => {
      if (prev.has(url)) return prev
      const next = new Set(prev)
      next.add(url)
      return next
    })
  }, [])

  const handleTransitionEnd = useCallback(
    (event: React.TransitionEvent) => {
      if (event.target !== event.currentTarget) return
      setIsTransitioning(false)
      if (displayIndex === 0 || displayIndex === displayCount - 1) {
        setNavigatedIndex((prev) => {
          const real = displayToReal(prev)
          onIndexChange?.(real)
          return realToDisplay(real)
        })
      }
    },
    [displayIndex, displayCount, displayToReal, realToDisplay, onIndexChange]
  )

  const goToPrev = useCallback(() => {
    if (isTransitioning) return
    if (navigatedIndex <= 0) return
    setIsTransitioning(true)
    setNavigatedIndex((prev) => prev - 1)
    setScale(1)
  }, [isTransitioning, navigatedIndex])

  const goToNext = useCallback(() => {
    if (isTransitioning) return
    if (navigatedIndex >= displayCount - 1) return
    setIsTransitioning(true)
    setNavigatedIndex((prev) => prev + 1)
    setScale(1)
  }, [isTransitioning, navigatedIndex, displayCount])

  const handleDoubleClick = useCallback(() => {
    setScale((prev) => (prev > 1 ? 1 : 2))
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setScale((prev) => {
        const delta = -e.deltaY * 0.01
        return Math.max(minScale, Math.min(maxScale, prev + delta))
      })
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const t = e.touches[0]
    touchState.current = {
      startX: t.clientX,
      startY: t.clientY,
      isSwiping: false,
      isPanning: false,
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const s = touchState.current
      if (!s || e.touches.length !== 1) return

      const t = e.touches[0]
      const diffX = t.clientX - s.startX
      const diffY = t.clientY - s.startY

      if (!s.isSwiping && !s.isPanning) {
        if (Math.abs(diffY) > Math.abs(diffX) + 10) {
          s.isPanning = true
          return
        }
        if (Math.abs(diffX) > 10) {
          s.isSwiping = true
        }
      }

      if (s.isSwiping && scale <= 1) {
        e.preventDefault()
        const el = containerRef.current?.firstElementChild as HTMLElement | null
        if (el) {
          const offset = t.clientX - s.startX
          el.style.transition = "none"
          el.style.transform = `translateX(calc(-${(displayIndex * 100) / displayCount}% + ${offset}px))`
        }
      }

      if (s.isPanning && scale > 1) {
        e.preventDefault()
      }
    },
    [scale, displayCount, displayIndex]
  )

  function setFlexTransform(translateX: string) {
    const el = containerRef.current?.firstElementChild as HTMLElement | null
    if (!el) return
    el.style.transition = "transform 0.3s ease-out"
    el.style.transform = translateX
  }

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const s = touchState.current
      if (!s) return
      if (isTransitioning) return

      if (s.isSwiping && scale <= 1) {
        const diffX = e.changedTouches[0].clientX - s.startX
        const di = displayIndex

        if (Math.abs(diffX) > 60) {
          if (diffX > 0) {
            if (di > 0) {
              setFlexTransform(
                `translateX(-${((di - 1) * 100) / displayCount}%)`
              )
              goToPrev()
            }
          } else {
            if (di < displayCount - 1) {
              setFlexTransform(
                `translateX(-${((di + 1) * 100) / displayCount}%)`
              )
              goToNext()
            }
          }
        } else {
          setFlexTransform(`translateX(-${(di * 100) / displayCount}%)`)
        }
      }

      touchState.current = null
    },
    [scale, displayCount, displayIndex, goToPrev, goToNext, isTransitioning]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev()
      else if (e.key === "ArrowRight") goToNext()
    },
    [goToPrev, goToNext]
  )

  if (total === 0) return null

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-black"
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${(displayIndex * 100) / displayCount}%)`,
          width: `${displayCount * 100}%`,
          transition: isTransitioning ? "transform 0.3s ease-out" : "none",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {displayImages.map((img, i) => {
          return (
            <div
              key={i}
              className="flex h-full w-full items-center justify-center"
              style={{ width: `${100 / displayCount}%` }}
            >
              <div
                className="relative flex h-full w-full touch-none items-center justify-center select-none"
                onDoubleClick={handleDoubleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {!loadedUrls.has(img.imageUrl) && (
                  <Skeleton className="absolute inset-0 h-full w-full" />
                )}
                <CachedImage
                  src={img.imageUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                  style={{
                    transform: `scale(${Math.max(1, scale)})`,
                    transformOrigin: "center center",
                    transition: "transform 0.1s ease-out",
                  }}
                  onLoad={() => handleImageLoad(img.imageUrl)}
                />
              </div>
            </div>
          )
        })}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            onClick={goToPrev}
            aria-label="Previous image"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            onClick={goToNext}
            aria-label="Next image"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
