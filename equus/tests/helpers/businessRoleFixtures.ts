import Stable from "@/models/Stable.ts";
import type { Types } from "mongoose";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

export async function createTestStable(userId: Types.ObjectId | string, overrides: Record<string, unknown> = {}) {
  return Stable.create({
    userId,
    tradeName: "Test Stable",
    description: "A test stable for unit tests",
    email: "stable@example.com",
    phoneNumber: "+351912345678",
    address: minimalAddress,
    ...overrides,
  });
}
