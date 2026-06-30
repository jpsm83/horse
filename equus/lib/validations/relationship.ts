import { z } from "zod";
import { businessRoleTypeEnums, relationshipTypeEnums, relationshipStatusEnums } from "../../utils/enums.ts";

const entityOwnedRelationshipTypes = businessRoleTypeEnums;

export const updateRelationshipStatusSchema = z.object({
  status: z.enum(["accepted", "declined"] as const),
});

export type UpdateRelationshipStatusInput = z.infer<typeof updateRelationshipStatusSchema>;

export const listRelationshipsQuerySchema = z.object({
  status: z.enum(relationshipStatusEnums).optional(),
});

export const createRelationshipSchema = z
  .object({
    horseId: z.string().trim().min(1),
    relationshipType: z.enum(relationshipTypeEnums),
    receiverAccountId: z.string().trim().min(1).optional(),
    invitedEmail: z.string().trim().email().optional(),
    invitedName: z.string().trim().min(1).max(200).optional(),
    requestMessage: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    const hasProfile = Boolean(data.receiverAccountId?.trim());
    const hasEmail = Boolean(data.invitedEmail?.trim());

    if (hasProfile === hasEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of receiverAccountId or invitedEmail",
        path: hasProfile && hasEmail ? ["receiverAccountId"] : ["invitedEmail"],
      });
      return;
    }

    if (
      (entityOwnedRelationshipTypes as readonly string[]).includes(data.relationshipType) &&
      !hasProfile
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "receiverAccountId is required for entity-owned provider types",
        path: ["receiverAccountId"],
      });
    }
  });

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;
