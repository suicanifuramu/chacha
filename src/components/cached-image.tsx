import { useState } from "react"
import { cn } from "@/lib/utils"
import { useImageCache } from "@/hooks/use-image-cache"

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  noCache?: boolean
}

export function CachedImage({
  src,
  alt,
  className,
  noCache = false,
  onError,
  onLoad,
  ...props
}: CachedImageProps) {
  const { cachedSrc } = useImageCache(src, noCache)
  const [imgLoaded, setImgLoaded] = useState(false)

  if (!cachedSrc) return null

  return (
    <img
      src={cachedSrc}
      alt={alt}
      className={cn(
        "transition-opacity duration-300",
        imgLoaded ? "opacity-100" : "opacity-0",
        className
      )}
      onLoad={(e) => {
        setImgLoaded(true)
        onLoad?.(e)
      }}
      onError={(e) => {
        if (onError) onError(e)
        else (e.target as HTMLImageElement).style.display = "none"
      }}
      {...props}
    />
  )
}
