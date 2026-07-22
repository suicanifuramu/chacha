import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"

interface ResponsiveDialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  className?: string
  desktopClassName?: string
  mobileClassName?: string
  snapPoints?: (number | string)[]
  snapToSequentialPoint?: boolean
  direction?: "top" | "bottom" | "left" | "right"
  showCloseButton?: boolean
}

export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
  title,
  className,
  desktopClassName,
  mobileClassName,
  snapPoints,
  snapToSequentialPoint,
  direction = "bottom",
  showCloseButton,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const ariaTitle = title || "ダイアログ"

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={desktopClassName || className}
          showCloseButton={showCloseButton}
        >
          <DialogTitle className="sr-only">{ariaTitle}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      snapToSequentialPoint={snapToSequentialPoint}
      direction={direction}
    >
      <DrawerContent className={mobileClassName || className}>
        <DrawerTitle className="sr-only">{ariaTitle}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  )
}
