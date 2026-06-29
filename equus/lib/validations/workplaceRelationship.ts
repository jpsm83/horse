/**
 * Workplace relationship validation — Zod schemas for collaboration invite and update APIs.
 */

import { z } from "zod";
import { workplaceHierarchyLevelEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";

export const inviteCollaboratorSchema = z
  .object({
    email: emailSchema,
    hierarchyLevel: z.enum(workplaceHierarchyLevelEnums).optional(),
    staffRole: z.enum(workplaceHierarchyLevelEnums).optional(),
    title: z.string().trim().max(120).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .refine((data) => data.hierarchyLevel !== undefined || data.staffRole !== undefined, {
    message: "hierarchyLevel or staffRole is required",
  })
  .transform(({ email, hierarchyLevel, staffRole, title, description }) => ({
    email,
    hierarchyLevel: hierarchyLevel ?? staffRole!,
    title,
    description,
  }));

export const updateCollaboratorSchema = z
  .object({
    hierarchyLevel: z.enum(workplaceHierarchyLevelEnums).optional(),
    staffRole: z.enum(workplaceHierarchyLevelEnums).optional(),
    title: z.string().trim().max(120).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .transform(({ hierarchyLevel, staffRole, title, description }) => ({
    hierarchyLevel: hierarchyLevel ?? staffRole,
    title,
    description,
  }));

/** @deprecated Use inviteCollaboratorSchema */
export const inviteStaffSchema = inviteCollaboratorSchema;

/** @deprecated Use updateCollaboratorSchema */
export const updateStaffRoleSchema = updateCollaboratorSchema;
