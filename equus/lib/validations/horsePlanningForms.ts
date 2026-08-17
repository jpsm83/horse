/**
 * Planning event create schemas — API + client form.
 */

import { z } from "zod";

/** Owner-team personal events on the horse calendar (not stable ops / entity-sourced writes). */
export const planningEventTypeEnums = [
  "appointment",
  "competition",
  "training",
  "other",
] as const;

function optionalTrimmedString(max?: number) {
  let schema = z.string().trim();
  if (max != null) schema = schema.max(max);
  return schema
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));
}

/** API body for POST /api/v1/horses/:id/planning — owner personal events only. */
export const createPlanningEventSchema = z.object({
  eventType: z.enum(planningEventTypeEnums),
  title: z.string().trim().min(1).max(200),
  startDate: z.string().trim().min(1),
  endDate: optionalTrimmedString(),
  location: optionalTrimmedString(200),
});

export type CreatePlanningEventInput = z.infer<typeof createPlanningEventSchema>;

export type PlanningEventFormMessages = {
  titleRequired: string;
  startDateRequired: string;
};

/** Client form values (optional fields as empty string). */
export type PlanningEventFormValues = {
  eventType: (typeof planningEventTypeEnums)[number];
  title: string;
  startDate: string;
  endDate: string;
  location: string;
};

export function planningEventFormSchema(messages: PlanningEventFormMessages) {
  return z.object({
    eventType: z.enum(planningEventTypeEnums),
    title: z.string().trim().min(1, messages.titleRequired).max(200),
    startDate: z.string().trim().min(1, messages.startDateRequired),
    endDate: z.string(),
    location: z.string().max(200),
  });
}
