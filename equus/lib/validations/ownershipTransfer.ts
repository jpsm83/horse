/**
 * Zod schemas for ownership transfer REST routes (`/api/v1/ownership-transfers`).
 */

import { z } from "zod";
import {
  ownershipTransferEntityTypeEnums,
  ownershipTransferKindEnums,
  ownershipTransferStatusEnums,
} from "../../utils/enums.ts";
import { emailSchema, objectIdSchema } from "./common.ts";

export const ownershipTransferIdParamSchema = objectIdSchema;

export const createOwnershipTransferSchema = z
  .object({
    entityType: z.enum(ownershipTransferEntityTypeEnums),
    entityId: objectIdSchema,
    transferKind: z.enum(ownershipTransferKindEnums),
    receiverUserId: objectIdSchema.optional(),
    targetCoOwnerUserId: objectIdSchema.optional(),
    invitedEmail: emailSchema.optional(),
    invitedName: z.string().trim().min(1).max(200).optional(),
    requestMessage: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    const isCoOwnerKind =
      data.transferKind === "remove_co_owner" || data.transferKind === "promote_co_owner";

    if (isCoOwnerKind) {
      if (!data.targetCoOwnerUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetCoOwnerUserId is required for this transfer kind",
          path: ["targetCoOwnerUserId"],
        });
      }
      return;
    }

    const hasReceiver = Boolean(data.receiverUserId);
    const hasEmail = Boolean(data.invitedEmail?.trim());
    if (hasReceiver === hasEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of receiverUserId or invitedEmail",
        path: hasReceiver && hasEmail ? ["receiverUserId"] : ["invitedEmail"],
      });
    }

    if (data.targetCoOwnerUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "targetCoOwnerUserId is not used for transfer_main",
        path: ["targetCoOwnerUserId"],
      });
    }
  });

export type CreateOwnershipTransferBody = z.infer<typeof createOwnershipTransferSchema>;

export const updateOwnershipTransferStatusSchema = z.object({
  status: z.enum(["accepted", "declined"] as const),
});

export type UpdateOwnershipTransferStatusInput = z.infer<
  typeof updateOwnershipTransferStatusSchema
>;

export const listOwnershipTransfersQuerySchema = z.object({
  status: z.enum(ownershipTransferStatusEnums).optional(),
});

export type ListOwnershipTransfersQuery = z.infer<
  typeof listOwnershipTransfersQuerySchema
>;
