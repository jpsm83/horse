/**
 * Role membership validation — Zod schemas for staff invite and role update APIs.
 */

import { z } from "zod";
import { roleStaffLevelEnums } from "../../utils/enums.ts";
import { emailSchema } from "./common.ts";

export const inviteStaffSchema = z.object({
  email: emailSchema,
  staffRole: z.enum(roleStaffLevelEnums),
});

export const updateStaffRoleSchema = z.object({
  staffRole: z.enum(roleStaffLevelEnums),
});
