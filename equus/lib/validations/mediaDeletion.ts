import { z } from "zod";
import { objectIdSchema } from "./common.ts";

export const createMediaDeletionRequestSchema = z.object({
  mediaId: objectIdSchema,
  requestMessage: z.string().trim().max(2000).optional(),
});

export type CreateMediaDeletionRequestInput = z.infer<
  typeof createMediaDeletionRequestSchema
>;

export const respondMediaDeletionRequestSchema = z.object({
  status: z.enum(["approved", "declined"] as const),
  responseMessage: z.string().trim().max(2000).optional(),
});

export type RespondMediaDeletionRequestInput = z.infer<
  typeof respondMediaDeletionRequestSchema
>;

export const listMediaDeletionRequestsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "declined", "cancelled"] as const).optional(),
});
