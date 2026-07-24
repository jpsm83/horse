/**
 * Zod schemas for pedigree connection REST routes.
 */

import { z } from "zod";
import {
  pedigreeConnectionRoleEnums,
  pedigreeConnectionStatusEnums,
} from "../../utils/enums.ts";
import { emailSchema, objectIdSchema } from "./common.ts";

export const pedigreeConnectionIdParamSchema = objectIdSchema;

export const createPedigreeConnectionSchema = z
  .object({
    childHorseId: objectIdSchema,
    role: z.enum(pedigreeConnectionRoleEnums),
    /** Search path: existing parent horse. */
    parentHorseId: objectIdSchema.optional(),
    /** Invite path: parent name + owner email. */
    parentHorseName: z.string().trim().min(1).max(200).optional(),
    invitedEmail: emailSchema.optional(),
    invitedName: z.string().trim().min(1).max(200).optional(),
  })
  .superRefine((data, ctx) => {
    const hasParentId = Boolean(data.parentHorseId);
    const hasInvite =
      Boolean(data.parentHorseName?.trim()) && Boolean(data.invitedEmail?.trim());

    if (hasParentId === hasInvite) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Provide either parentHorseId (search) or parentHorseName + invitedEmail (invite)",
        path: ["parentHorseId"],
      });
    }
  });

export type CreatePedigreeConnectionBody = z.infer<typeof createPedigreeConnectionSchema>;

export const updatePedigreeConnectionStatusSchema = z.object({
  status: z.enum(["accepted", "declined"] as const),
});

export const listPedigreeConnectionsQuerySchema = z.object({
  status: z.enum(pedigreeConnectionStatusEnums).optional(),
});
