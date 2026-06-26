import { z } from "zod";
import { relationshipStatusEnums } from "../../utils/enums.ts";

export const updateRelationshipStatusSchema = z.object({
  status: z.enum(["accepted", "declined"] as const),
});

export type UpdateRelationshipStatusInput = z.infer<typeof updateRelationshipStatusSchema>;

export const listRelationshipsQuerySchema = z.object({
  status: z.enum(relationshipStatusEnums).optional(),
});
