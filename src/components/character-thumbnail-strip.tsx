"use client"

import { CachedImage } from "@/components/cached-image"
import { cn } from "@/lib/utils"

interface CharacterThumbnailStripProps {
  images: Array<{ imageUrl: string; aspectRatio: number }>
  currentIndex: number
  onSelect: (index: number) => void
}

export function CharacterThumbnailStrip({
  images,
  currentIndex,
  onSelect,
}: CharacterThumbnailStripProps) {
  if (images.length <= 1) return null

  return (
    <div className="px-4 py-3">
      <div
        className="flex flex-row gap-1.5 overflow-x-auto pt-3 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "rounded-6 relative flex flex-col items-center justify-center overflow-hidden bg-background transition-all duration-100 ease-out",
              i === currentIndex
                ? "ring-2 ring-primary"
                : "opacity-70 ring-1 ring-transparent hover:opacity-100"
            )}
            style={{ height: 56, width: 56, flexShrink: 0 }}
            aria-label={`キャラクター画像 ${i + 1}/${images.length}`}
            aria-current={i === currentIndex ? "true" : "false"}
          >
            <CachedImage
              src={images[i].imageUrl}
              alt={`Thumbnail ${i + 1}`}
              className="aspect-square h-full w-full object-cover"
            />
            {i === currentIndex && (
              <div className="rounded-6 pointer-events-none absolute inset-0 ring-2 ring-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
