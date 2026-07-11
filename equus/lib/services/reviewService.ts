import mongoose from "mongoose";
import Rating from "../../models/Rating.ts";
import Relationship from "../../models/Relationship.ts";
import Horse from "../../models/Horse.ts";
import { ApiError } from "../api/errors.ts";
import { userOwnsEntity } from "../ownership/entityOwnership.ts";
import type { CreateReviewInput, RespondToReviewInput } from "../validations/review.ts";

export type PublicReview = {
  id: string;
  horseId: string;
  relationshipId: string;
  reviewerUserId: string;
  revieweeUserId: string;
  revieweeAccountType?: string;
  revieweeAccountId?: string;
  overallScore: number;
  categoryScores?: { category: string; score: number }[];
  comment?: string;
  response?: string;
  respondedAt?: Date;
  isVerifiedInteraction: boolean;
  isPublic: boolean;
  createdAt: Date;
};

function toPublicReview(doc: Record<string, unknown>): PublicReview {
  return {
    id: String(doc._id),
    horseId: String(doc.horseId),
    relationshipId: String(doc.relationshipId),
    reviewerUserId: String(doc.reviewerUserId),
    revieweeUserId: String(doc.revieweeUserId),
    revieweeAccountType: doc.revieweeAccountType as string | undefined,
    revieweeAccountId: doc.revieweeAccountId as string | undefined,
    overallScore: Number(doc.overallScore),
    categoryScores: doc.categoryScores as { category: string; score: number }[] | undefined,
    comment: doc.comment as string | undefined,
    response: doc.response as string | undefined,
    respondedAt: doc.respondedAt as Date | undefined,
    isVerifiedInteraction: doc.isVerifiedInteraction as boolean,
    isPublic: doc.isPublic as boolean,
    createdAt: doc.createdAt as Date,
  };
}

export async function createReview(
  actorUserId: string,
  horseId: string,
  input: CreateReviewInput,
): Promise<PublicReview> {
  if (
    !mongoose.Types.ObjectId.isValid(horseId) ||
    !mongoose.Types.ObjectId.isValid(input.relationshipId)
  ) {
    throw new ApiError(400, "Invalid horse or relationship id", "VALIDATION_ERROR");
  }

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  const relationship = await Relationship.findById(input.relationshipId).lean();
  if (!relationship) {
    throw new ApiError(404, "Relationship not found", "NOT_FOUND");
  }

  if (String(relationship.horseId) !== horseId) {
    throw new ApiError(400, "Relationship does not belong to this horse", "VALIDATION_ERROR");
  }

  if (relationship.status !== "accepted" && relationship.status !== "ended") {
    throw new ApiError(400, "Only accepted or ended relationships can be reviewed", "VALIDATION_ERROR");
  }

  if (!relationship.receiverUserId) {
    throw new ApiError(400, "Provider has not accepted the relationship yet", "VALIDATION_ERROR");
  }

  const requesterId = String(relationship.requesterUserId);
  const receiverId = String(relationship.receiverUserId);

  const isRequester = requesterId === actorUserId;
  const isReceiver = receiverId === actorUserId;

  if (!isRequester && !isReceiver) {
    throw new ApiError(403, "You are not a party to this relationship", "FORBIDDEN");
  }

  const existing = await Rating.findOne({
    horseId,
    reviewerUserId: actorUserId,
    relationshipId: input.relationshipId,
  }).lean();

  if (existing) {
    throw new ApiError(409, "You have already reviewed this relationship", "CONFLICT");
  }

  let revieweeUserId: string;
  let revieweeAccountType: string | undefined;
  let revieweeAccountId: string | undefined;

  if (isRequester) {
    revieweeUserId = receiverId;
    revieweeAccountType = relationship.receiverAccountType as string | undefined;
    revieweeAccountId = relationship.receiverAccountId
      ? String(relationship.receiverAccountId)
      : undefined;
  } else {
    revieweeUserId = requesterId;
    revieweeAccountType = "user";
    revieweeAccountId = undefined;
  }

  const rating = await Rating.create({
    horseId,
    relationshipId: input.relationshipId,
    reviewerUserId: actorUserId,
    revieweeUserId,
    revieweeAccountType,
    revieweeAccountId,
    overallScore: input.overallScore,
    categoryScores: input.categoryScores,
    comment: input.comment?.trim(),
    isVerifiedInteraction: true,
    isPublic: true,
  });

  return toPublicReview(rating.toObject() as Record<string, unknown>);
}

export async function listReviewsForHorse(
  horseId: string,
): Promise<PublicReview[]> {
  if (!mongoose.Types.ObjectId.isValid(horseId)) {
    throw new ApiError(400, "Invalid horse id", "VALIDATION_ERROR");
  }

  const ratings = await Rating.find({ horseId, isActive: { $ne: false } })
    .sort({ createdAt: -1 })
    .lean();

  return ratings.map((doc) => toPublicReview(doc as Record<string, unknown>));
}

export async function respondToReview(
  actorUserId: string,
  reviewId: string,
  input: RespondToReviewInput,
): Promise<PublicReview> {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(400, "Invalid review id", "VALIDATION_ERROR");
  }

  const rating = await Rating.findById(reviewId);
  if (!rating) {
    throw new ApiError(404, "Review not found", "NOT_FOUND");
  }

  if (String(rating.revieweeUserId) !== actorUserId) {
    throw new ApiError(403, "Only the reviewee can respond to this review", "FORBIDDEN");
  }

  if (rating.response) {
    throw new ApiError(400, "You have already responded to this review", "VALIDATION_ERROR");
  }

  rating.response = input.response.trim();
  rating.respondedAt = new Date();
  await rating.save();

  return toPublicReview(rating.toObject() as Record<string, unknown>);
}
