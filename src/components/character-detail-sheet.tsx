"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { X } from "lucide-react"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Button } from "@/components/ui/button"
import { CharacterImageCarousel } from "@/components/character-image-carousel"
import { CharacterThumbnailStrip } from "@/components/character-thumbnail-strip"
import { cn } from "@/lib/utils"
import { replaceUserVars } from "@/lib/user-vars"
import type { Character } from "@/lib/types"

interface CharacterDetailSheetProps {
  character: Character | null
  plotId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CharacterDetailSheet({
  character,
  plotId,
  open,
  onOpenChange,
}: CharacterDetailSheetProps) {
  const [images, setImages] = useState<
    Array<{ imageUrl: string; aspectRatio: number }>
  >([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFullDesc, setShowFullDesc] = useState(false)

  useEffect(() => {
    if (!open || !character) return
    setImages(
      character.imageUrl
        ? [{ imageUrl: character.imageUrl, aspectRatio: 0.75 }]
        : []
    )
    setCurrentIndex(0)
  }, [open, character])

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showFullDesc) {
      scrollRef.current?.scrollTo(0, 0)
    }
  }, [showFullDesc])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && showFullDesc) {
        setShowFullDesc(false)
        return
      }
      onOpenChange(newOpen)
    },
    [showFullDesc, onOpenChange]
  )

  if (!character || !open) return null

  const desc = replaceUserVars(character.persona || character.description || "")
  const showReadMore = desc.length > 100 || desc.includes("\n")

  const detailContent = (
    <>
      <div className="flex shrink-0 items-center justify-between bg-popover/95 px-4 py-3 backdrop-blur">
        <div className="flex-1" />
        <span className="text-center text-base font-medium">
          {character.name}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            showFullDesc ? setShowFullDesc(false) : onOpenChange(false)
          }
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {showFullDesc ? (
          <div className="min-h-full bg-popover/95 px-4 py-4 text-sm whitespace-pre-wrap text-muted-foreground backdrop-blur">
            {desc}
          </div>
        ) : (
          <>
            <div className="relative aspect-square bg-muted">
              <CharacterImageCarousel
                images={images}
                index={currentIndex}
                onIndexChange={setCurrentIndex}
              />
            </div>

            <div className="px-4 py-4">
              <CharacterDescription
                description={desc}
                showReadMore={showReadMore}
                onReadMore={() => setShowFullDesc(true)}
              />
            </div>

            <CharacterThumbnailStrip
              images={images}
              currentIndex={currentIndex}
              onSelect={setCurrentIndex}
            />
          </>
        )}
      </div>
    </>
  )

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={character.name}
      desktopClassName="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0"
      mobileClassName="flex max-h-[85vh] flex-col"
      showCloseButton={false}
    >
      {detailContent}
    </ResponsiveDialog>
  )
}

function CharacterDescription({
  description,
  showReadMore,
  onReadMore,
}: {
  description: string
  showReadMore: boolean
  onReadMore: () => void
}) {
  if (!description) return null

  return (
    <div>
      <div
        className={cn(
          "text-left text-sm break-all whitespace-pre-wrap text-muted-foreground",
          "line-clamp-5"
        )}
      >
        {description}
      </div>
      {showReadMore && (
        <button
          type="button"
          onClick={onReadMore}
          className="mt-2 block text-center text-sm text-muted-foreground/50 underline"
        >
          続きを読む
        </button>
      )}
    </div>
  )
}
