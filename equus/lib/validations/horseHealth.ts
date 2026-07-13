import { z } from "zod";

export const healthRecordTypeEnum = z.enum([
  "vaccination", "exam", "medication", "injury", "allergy", "other",
]);

export const visibilityModeEnum = z.enum(["owner", "entities", "public"]);

export const createHealthRecordSchema = z.object({
  recordType: healthRecordTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  performedBy: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  visibilityMode: visibilityModeEnum.optional().default("owner"),
  visibilityEntityIds: z.array(z.string()).optional(),
});

export const updateHealthRecordSchema = createHealthRecordSchema.partial();

export const listHealthRecordsQuerySchema = z.object({
  recordType: healthRecordTypeEnum.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
