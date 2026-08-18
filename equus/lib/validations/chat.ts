import { z } from "zod";

export const createThreadSchema = z.object({
  targetUserId: z.string().trim().min(1),
  contextPrefix: z.string().trim().max(500).optional(),
  initialBody: z.string().trim().min(1).max(4000).optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  contextPrefix: z.string().trim().max(500).optional(),
});

export const listThreadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const listMessagesQuerySchema = z.object({
  before: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const blockUserSchema = z.object({
  blockedUserId: z.string().trim().min(1),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
