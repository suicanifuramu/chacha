import { z } from "zod"

/**
 * Validation schemas for chacha API response shapes.
 */

// `UserChatProfile` — used by profile management.
export const UserChatProfileSchema = z.object({
  id: z.string(),
  userAlias: z.string().optional(),
  name: z.string().optional(),
  persona: z.string().optional(),
  gender: z.string().optional(),
  isDefault: z.boolean().optional(),
  thumbnailImageId: z.string().nullish(),
  selected: z.boolean().optional(),
})

/**
 * `ImageUploadResponse` — used after uploading a chat profile image.
 */
export const ImageUploadResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
})
