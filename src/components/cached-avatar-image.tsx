import { useState } from "react"
import { AvatarImage } from "@/components/ui/avatar"
import { useImageCache } from "@/hooks/use-image-cache"

interface CachedAvatarImageProps {
  src?: string
  alt?: string
  noCache?: boolean
  className?: string
}

export function CachedAvatarImage({
  src,
  alt,
  noCache = false,
  className,
}: CachedAvatarImageProps) {
  const { cachedSrc } = useImageCache(src, noCache)
  const [errored, setErrored] = useState(false)

  if (!cachedSrc || errored) return null

  return (
    <AvatarImage
      src={cachedSrc}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  )
}
