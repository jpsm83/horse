import { z } from "zod";
import { objectIdSchema } from "./common.ts";

export const createDocumentDeletionRequestSchema = z.object({
  documentId: objectIdSchema,
  requestMessage: z.string().trim().max(2000).optional(),
});

export type CreateDocumentDeletionRequestInput = z.infer<
  typeof createDocumentDeletionRequestSchema
>;

export const respondDocumentDeletionRequestSchema = z.object({
  status: z.enum(["approved", "declined"] as const),
  responseMessage: z.string().trim().max(2000).optional(),
});

export type RespondDocumentDeletionRequestInput = z.infer<
  typeof respondDocumentDeletionRequestSchema
>;

export const listDocumentDeletionRequestsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "declined", "cancelled"] as const).optional(),
});
