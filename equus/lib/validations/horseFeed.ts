import { z } from "zod";

export const mealTimeEnum = z.enum(["morning", "afternoon", "evening", "night"]);

export const dayEnum = z.enum(["mon","tue","wed","thu","fri","sat","sun"]);

export const supplementSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.string().optional(),
  unit: z.string().optional(),
});

export const createFeedPlanSchema = z.object({
  mealTime: mealTimeEnum,
  feedType: z.string().min(1).max(200),
  quantity: z.string().optional(),
  unit: z.string().optional().default("kg"),
  supplements: z.array(supplementSchema).optional(),
  notes: z.string().max(2000).optional(),
  scheduleDays: z.array(dayEnum).optional(),
  visibilityMode: z.enum(["owner", "entities", "public"]).optional().default("owner"),
  visibilityEntityIds: z.array(z.string()).optional(),
});

export const updateFeedPlanSchema = createFeedPlanSchema.partial();

export const listFeedPlansQuerySchema = z.object({
  mealTime: mealTimeEnum.optional(),
  isActive: z.coerce.boolean().optional(),
});
