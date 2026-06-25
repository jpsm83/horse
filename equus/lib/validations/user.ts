import { z } from "zod";
import { genderEnums, idTypeEnums } from "../../utils/enums.ts";

export const addressSchema = z.object({
  country: z.string().trim().min(1),
  state: z.string().trim().min(1),
  city: z.string().trim().min(1),
  street: z.string().trim().min(1),
  buildingNumber: z.string().trim().min(1),
  doorNumber: z.string().trim().optional(),
  complement: z.string().trim().optional(),
  postCode: z.string().trim().min(1),
  region: z.string().trim().optional(),
  additionalDetails: z.string().trim().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
});

export const updatePersonalDetailsSchema = z.object({
  username: z.string().trim().min(1).max(50).optional(),
  idType: z.enum(idTypeEnums).optional(),
  idNumber: z.string().trim().min(1).optional(),
  address: addressSchema.optional(),
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  nationality: z.string().trim().min(1).optional(),
  gender: z.enum(genderEnums).optional(),
  birthDate: z.coerce.date().optional(),
  phoneNumber: z.string().trim().min(1).optional(),
  bio: z.string().trim().max(2000).optional(),
  preferredLanguage: z.string().trim().min(2).max(10).optional(),
  timezone: z.string().trim().min(1).optional(),
});
