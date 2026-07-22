import { useEffect, useRef, useState } from "react"
import { Camera, Check, Pencil, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserChatProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { ImageCropDialog } from "@/components/image-crop-dialog"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  createUserChatProfile,
  updateUserChatProfile,
  imageIdToUrl,
} from "@/lib/api"
import { toast } from "sonner"

export interface PlotProfileItem {
  id: string
  name: string
  description?: string
  summary?: string
  profileImageUrl?: string
}

interface ProfileSelectSheetProps {
  variant?: "start" | "change"
  profiles: UserChatProfile[]
  plotProfiles?: PlotProfileItem[]
  open: boolean
  onOpenChange?: (open: boolean) => void
  onSelect?: (profile: UserChatProfile) => void
  onPlotSelect?: (profile: PlotProfileItem) => void
  onCreateProfile?: (profile: UserChatProfile) => void
  onProfileUpdated?: (profile: UserChatProfile) => Promise<void>
  loading?: boolean
  initialSelectedId?: string
}

function CreateProfileSheet({
  open,
  onOpenChange,
  onProfileCreated,
  editProfile,
  onProfileUpdated,
  variant,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProfileCreated: (profile: UserChatProfile) => Promise<void>
  editProfile?: UserChatProfile | null
  onProfileUpdated?: (profile: UserChatProfile) => Promise<void>
  variant: "start" | "change"
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [name, setName] = useState("")
  const [gender, setGender] = useState("MALE")
  const [description, setDescription] = useState("")
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!editProfile

  useEffect(() => {
    if (editProfile) {
      setName(editProfile.userAlias || editProfile.name || "")
      setGender(editProfile.gender || "MALE")
      setDescription(editProfile.persona || editProfile.description || "")
      setProfileImageUrl(editProfile.thumbnailImageId || "")
      setIsDefault(editProfile.isDefault || false)
    }
  }, [editProfile])

  useEffect(() => {
    if (!open) {
      setName("")
      setGender("MALE")
      setDescription("")
      setProfileImageUrl("")
      setCropFile(null)
      setIsDefault(false)
    }
  }, [open])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCropFile(file)
    setCropOpen(true)

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCropComplete = (id: string) => {
    setProfileImageUrl(id)
    setCropOpen(false)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("名前を入力してください")
      return
    }
    setSaving(true)
    try {
      if (isEditing && editProfile) {
        await updateUserChatProfile(editProfile.id, {
          userAlias: name.trim(),
          gender: gender,
          persona: description.trim(),
          thumbnailImageId: profileImageUrl || undefined,
          isDefault,
        })
        toast.success("プロフィールを更新しました")
        await onProfileUpdated?.({
          ...editProfile,
          userAlias: name.trim(),
          gender,
          persona: description.trim(),
          thumbnailImageId: profileImageUrl || null,
          isDefault,
        })
      } else {
        const res = await createUserChatProfile({
          userAlias: name.trim(),
          gender: gender,
          persona: description.trim(),
          thumbnailImageId: profileImageUrl || undefined,
          isDefault,
        })
        await onProfileCreated(res.chatUserProfile)
      }
    } catch (e: unknown) {
      toast.error(
        `${isEditing ? "更新" : "作成"}失敗: ${e instanceof Error ? e.message : String(e)}`
      )
      setSaving(false)
    }
  }

  const content = (
    <div className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pt-4 pb-2">
        <h2 className="text-lg font-semibold">{isEditing ? "プロフィールを編集" : "新しいプロフィール"}</h2>
      </div>
      <div className="touch-scrollable min-h-0 max-h-[85vh] overflow-y-auto overscroll-contain">
        <div className="space-y-4 px-5 py-4">
          <div className="flex justify-center">
            <button
              type="button"
              className="group relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              <Avatar className="size-20">
                <AvatarImage src={profileImageUrl ? imageIdToUrl(profileImageUrl) : undefined} />
                <AvatarFallback className="text-2xl">
                  {name ? name[0] : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-6 text-white" />
              </div>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">プロフィール名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プロフィール名を入力"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">性別</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer",
                  gender === "MALE"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                )}
                onClick={() => setGender("MALE")}
                disabled={saving}
              >
                男性
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer",
                  gender === "FEMALE"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                )}
                onClick={() => setGender("FEMALE")}
                disabled={saving}
              >
                女性
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">説明</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="説明を入力（任意）"
              rows={3}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3">
            <label className="text-sm font-medium">デフォルトに設定</label>
            <button
              type="button"
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                isDefault
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
              onClick={() => setIsDefault(!isDefault)}
              disabled={saving}
            >
              {isDefault ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        {isDesktop && (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            閉じる
          </Button>
        )}
        <Button
          className="cursor-pointer"
          disabled={saving}
          onClick={handleCreate}
        >
          {saving && <Spinner className="mr-1.5 size-4" />}
          {isEditing ? "保存" : variant === "change" ? "作成して変更" : "この名前で開始"}
        </Button>
      </div>

      {cropFile && (
        <ImageCropDialog
          open={cropOpen}
          onOpenChange={(v) => {
            setCropOpen(v)
            if (!v) setCropFile(null)
          }}
          file={cropFile}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="新しいプロフィール"
      desktopClassName="max-h-[85vh] max-w-md gap-0 overflow-y-auto p-0 sm:max-w-lg"
      mobileClassName="max-h-[85vh]"
    >
      {content}
    </ResponsiveDialog>
  )
}

export function ProfileSelectSheet({
  variant = "start",
  profiles,
  plotProfiles,
  open,
  onOpenChange,
  onSelect,
  onPlotSelect,
  onCreateProfile,
  onProfileUpdated,
  loading,
  initialSelectedId,
}: ProfileSelectSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editingProfile, setEditingProfile] = useState<UserChatProfile | null>(null)

  useEffect(() => {
    if (open) {
      const id =
        initialSelectedId ||
        profiles.find((p) => p.selected)?.id ||
        profiles[0]?.id ||
        (variant !== "change" ? plotProfiles?.[0]?.id : null) ||
        null
      setSelectedId(id)
    }
  }, [open, initialSelectedId, profiles, plotProfiles, variant])

  const findSelected = () => {
    const userProfile = profiles.find((p) => p.id === selectedId)
    if (userProfile) return { type: "user" as const, profile: userProfile }
    const plotProfile = plotProfiles?.find((p) => p.id === selectedId)
    if (plotProfile) return { type: "plot" as const, profile: plotProfile }
    return null
  }

  const handleConfirm = async () => {
    const selected = findSelected()
    if (!selected) return
    setConfirming(true)
    try {
      if (selected.type === "user") {
        await onSelect?.(selected.profile)
      } else {
        await onPlotSelect?.(selected.profile)
      }
    } finally {
      setConfirming(false)
    }
  }

  const hasPlotProfiles = plotProfiles && plotProfiles.length > 0

  const handleProfileCreated = async (profile: UserChatProfile) => {
    setShowCreate(false)
    await onCreateProfile?.(profile)
  }

  const handleProfileUpdated = async (profile: UserChatProfile) => {
    setEditingProfile(null)
    await onProfileUpdated?.(profile)
  }

  const content = (
    <div className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pt-4 pb-2">
        <h2 className="text-lg font-semibold">
          {variant === "change" ? "プロフィールを変更" : "プロフィールを選択"}
        </h2>
      </div>

      <div className="touch-scrollable min-h-0 max-h-[85vh] overflow-y-auto overscroll-contain px-5">
        <div className="flex flex-col gap-2 py-2">
          <button
            type="button"
            className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors bg-secondary/30 hover:bg-secondary/60"
            onClick={() => {
              if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
              setShowCreate(true)
            }}
          >
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/60">
              <Plus className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">新しいプロフィール</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                新しいトークプロフィールを作成します
              </p>
            </div>
          </button>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : profiles.length === 0 && !hasPlotProfiles ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              プロフィールがありません
            </p>
          ) : (
            <>
              {hasPlotProfiles && (
                <>
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-2 text-[11px] text-muted-foreground">
                        このプロットのプロフィール
                      </span>
                    </div>
                  </div>
                  {plotProfiles.map((p) => {
                    const isSelected = p.id === selectedId
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                          isSelected
                            ? "bg-primary/10 ring-1 ring-primary/40"
                            : "bg-secondary/30 hover:bg-secondary/60"
                        )}
                        onClick={() => setSelectedId(p.id)}
                      >
                        <Avatar className="mt-0.5 size-10 shrink-0">
                          <AvatarFallback className="text-sm">
                            {(p.name || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">
                              {p.name}
                            </p>
                            <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                              プロット
                            </span>
                          </div>
                          {p.description && (
                            <p
                              className={cn(
                                "mt-0.5 text-xs whitespace-pre-wrap text-muted-foreground",
                                !isSelected && "line-clamp-2"
                              )}
                            >
                              {p.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="mt-1 size-5 shrink-0 text-green-500" />
                        )}
                      </button>
                    )
                  })}
                </>
              )}
              {profiles.map((p) => {
                const isSelected = p.id === selectedId
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 ring-1 ring-primary/40"
                        : "bg-secondary/30 hover:bg-secondary/60"
                    )}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <Avatar className="mt-0.5 size-10 shrink-0">
                      <AvatarImage src={p.thumbnailImage?.url || p.profileImageUrl} />
                      <AvatarFallback className="text-sm">
                        {((p.userAlias || p.name) || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                         <p className="truncate text-sm font-medium">{p.userAlias || p.name}</p>
                        {p.isDefault && (
                          <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            デフォルト
                          </span>
                        )}
                      </div>
                      {(p.persona || p.description) && (
                        <p
                          className={cn(
                            "mt-0.5 text-xs whitespace-pre-wrap text-muted-foreground",
                            !isSelected && "line-clamp-2"
                          )}
                        >
                          {p.persona || p.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1 self-start mt-1">
                      {isSelected && (
                        <Check className="size-5 shrink-0 text-green-500" />
                      )}
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/80 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingProfile(p)
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        {isDesktop && (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => onOpenChange?.(false)}
          >
            閉じる
          </Button>
        )}
        <Button
          className="cursor-pointer"
          disabled={!selectedId || confirming}
          onClick={handleConfirm}
        >
          {confirming && <Spinner className="mr-1.5 size-4" />}
          {variant === "change" ? "このプロフィールに変更" : "この名前で開始"}
        </Button>
      </div>

      <CreateProfileSheet
        variant={variant}
        open={showCreate}
        onOpenChange={setShowCreate}
        onProfileCreated={handleProfileCreated}
      />
      <CreateProfileSheet
        variant={variant}
        editProfile={editingProfile}
        open={!!editingProfile}
        onOpenChange={(v) => { if (!v) setEditingProfile(null) }}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  )

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(v) => onOpenChange?.(v)}
      title={variant === "change" ? "プロフィールを変更" : "プロフィールを選択"}
      desktopClassName="max-h-[85vh] max-w-md gap-0 overflow-y-auto p-0 sm:max-w-lg"
      mobileClassName="max-h-[85vh]"
    >
      {content}
    </ResponsiveDialog>
  )
}
