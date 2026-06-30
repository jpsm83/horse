import Breeder from "@/models/Breeder.ts";
import Stable from "@/models/Stable.ts";
import RidingClub from "@/models/RidingClub.ts";
import Transport from "@/models/Transport.ts";
import type { Types } from "mongoose";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

export async function createTestStable(
  mainOwnerUserId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  return Stable.create({
    mainOwnerUserId,
    tradeName: "Test Stable",
    description: "A test stable for unit tests",
    email: "stable@example.com",
    phoneNumber: "+351912345678",
    address: minimalAddress,
    ...overrides,
  });
}

export async function createTestRidingClub(
  mainOwnerUserId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  return RidingClub.create({
    mainOwnerUserId,
    clubName: "Test Riding Club",
    description: "A test riding club for unit tests",
    email: "club@example.com",
    phoneNumber: "+351912345678",
    address: minimalAddress,
    ...overrides,
  });
}

export async function createTestTransport(
  mainOwnerUserId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  return Transport.create({
    mainOwnerUserId,
    companyName: "Test Transport",
    description: "A test transport company for unit tests",
    email: "transport@example.com",
    phoneNumber: "+351912345678",
    address: minimalAddress,
    ...overrides,
  });
}

export async function createTestBreeder(
  userId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  return Breeder.create({
    userId,
    operationName: "Test Breeder",
    description: "A test breeder for unit tests",
    email: "breeder@example.com",
    phoneNumber: "+351912345678",
    address: minimalAddress,
    ...overrides,
  });
}
