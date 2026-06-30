import Breeder from "@/models/Breeder.ts";
import Stable from "@/models/Stable.ts";
import RidingClub from "@/models/RidingClub.ts";
import Transport from "@/models/Transport.ts";
import Trainer from "@/models/Trainer.ts";
import Groom from "@/models/Groom.ts";
import Coach from "@/models/Coach.ts";
import Farrier from "@/models/Farrier.ts";
import Rider from "@/models/Rider.ts";
import Veterinary from "@/models/Veterinary.ts";
import User from "@/models/User.ts";
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
  mainOwnerUserId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  return Breeder.create({
    mainOwnerUserId,
    operationName: "Test Breeder",
    description: "A test breeder for unit tests",
    email: "breeder@example.com",
    phoneNumber: "+351912345678",
    address: minimalAddress,
    ...overrides,
  });
}

export async function createTestTrainer(
  userId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  const trainer = await Trainer.create({
    userId,
    displayName: "Test Trainer",
    bio: "A test trainer for unit tests",
    email: "trainer@example.com",
    phoneNumber: "+351912345678",
    address: minimalAddress,
    ...overrides,
  });

  await User.findByIdAndUpdate(userId, { trainerProfileId: trainer._id });
  return trainer;
}

export async function createTestGroom(
  userId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  const groom = await Groom.create({
    userId,
    displayName: "Test Groom",
    email: "groom@example.com",
    ...overrides,
  });

  await User.findByIdAndUpdate(userId, { groomProfileId: groom._id });
  return groom;
}

export async function createTestCoach(
  userId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  const coach = await Coach.create({
    userId,
    displayName: "Test Coach",
    bio: "A test coach for unit tests",
    email: "coach@example.com",
    phoneNumber: "+351912345678",
    address: minimalAddress,
    ...overrides,
  });

  await User.findByIdAndUpdate(userId, { coachProfileId: coach._id });
  return coach;
}

export async function createTestFarrier(
  userId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  const farrier = await Farrier.create({
    userId,
    displayName: "Test Farrier",
    email: "farrier@example.com",
    ...overrides,
  });

  await User.findByIdAndUpdate(userId, { farrierProfileId: farrier._id });
  return farrier;
}

export async function createTestRider(
  userId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  const rider = await Rider.create({
    userId,
    displayName: "Test Rider",
    email: "rider@example.com",
    ...overrides,
  });

  await User.findByIdAndUpdate(userId, { riderProfileId: rider._id });
  return rider;
}

export async function createTestVeterinary(
  userId: Types.ObjectId | string,
  overrides: Record<string, unknown> = {},
) {
  const veterinary = await Veterinary.create({
    userId,
    practiceName: "Test Veterinary",
    description: "A test veterinary practice for unit tests",
    email: "vet@example.com",
    phoneNumber: "+351912345678",
    address: minimalAddress,
    ...overrides,
  });

  await User.findByIdAndUpdate(userId, { veterinaryProfileId: veterinary._id });
  return veterinary;
}
