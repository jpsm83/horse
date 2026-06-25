import { z } from "zod";
import emailRegex from "../utils/emailRegex.ts";

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => emailRegex.test(value), "Please provide a valid email address");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
