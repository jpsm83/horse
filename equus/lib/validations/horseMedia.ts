import { z } from "zod";

export const createMediaSchema = z.object({
  type: z.enum(["image", "video", "other"]),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().int().positive().optional(),
  visibilityMode: z.enum(["owner", "entities", "public"]).optional().default("owner"),
  visibilityEntityIds: z.array(z.string()).optional(),
});
