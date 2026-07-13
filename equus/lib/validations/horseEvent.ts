import { z } from "zod";

export const eventTypeEnum = z.enum(["appointment", "competition", "training", "feeding", "other"]);

export const createEventSchema = z.object({
  eventType: eventTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/)).optional(),
  allDay: z.boolean().optional().default(false),
  location: z.string().max(200).optional(),
  visibilityMode: z.enum(["owner", "entities", "public"]).optional().default("entities"),
  visibilityEntityIds: z.array(z.string()).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const listEventsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  eventType: eventTypeEnum.optional(),
});
