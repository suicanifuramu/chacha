import { memo } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CachedAvatarImage } from "@/components/cached-avatar-image"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import type { InfoBoxContent, InfoBoxCharacter } from "@/lib/types"

interface InfoBoxProps {
  data: InfoBoxContent
  charAvatars?: Record<string, string>
}

function CustomAccordionTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof AccordionTrigger>) {
  return (
    <AccordionTrigger
      className={cn(
        "group/accordion-trigger relative flex flex-1 items-center justify-between rounded-lg border border-transparent py-2 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        data-slot="accordion-trigger-icon"
        className="pointer-events-none size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:hidden"
      />
      <ChevronUpIcon
        data-slot="accordion-trigger-icon"
        className="pointer-events-none hidden size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:inline"
      />
    </AccordionTrigger>
  )
}

function CustomAccordionContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof AccordionContent>) {
  return (
    <AccordionContent
      className={cn(
        "overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-(--radix-accordion-content-height) pt-0 pb-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
          className
        )}
      >
        {children}
      </div>
    </AccordionContent>
  )
}

export const InfoBox = memo(function InfoBox({
  data,
  charAvatars = {},
}: InfoBoxProps) {
  const characters = data.characters || []

  if (characters.length === 0) return null

  return (
    <div
      className={cn(
        "mx-auto my-2 w-full max-w-[80%] rounded-xl border border-amber-500/30 bg-amber-50/10 dark:bg-amber-900/10",
        "animate-in duration-200 zoom-in-95 fade-in"
      )}
    >
      <Accordion type="multiple" className="w-full">
        {characters.map((character: InfoBoxCharacter) => {
          const avatarUrl = charAvatars[character.name]
          const hasItems = character.items && character.items.length > 0

          if (!hasItems) return null

          return (
            <AccordionItem
              key={character.name}
              value={character.name}
              className="border-amber-500/20 last:border-0"
            >
              <CustomAccordionTrigger className="bg-transparent px-3 py-2 hover:bg-amber-500/5">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar className="size-7 shrink-0">
                    <CachedAvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {(character.name || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium text-amber-700 dark:text-amber-300">
                    {character.name}
                  </span>
                </div>
              </CustomAccordionTrigger>
              <CustomAccordionContent className="px-3">
                <div className="space-y-3 pb-2">
                  {character.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-amber-500/10 bg-white/50 p-3 dark:bg-black/20"
                    >
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {item.label}
                        </span>
                          <p className="flex-1 text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-foreground/80">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CustomAccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
})
