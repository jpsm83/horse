import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import Rating from "@/models/Rating.ts";
import * as userService from "@/lib/services/userService.ts";
import * as reviewService from "@/lib/services/reviewService.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { createTestVeterinary } from "../../helpers/businessRoleFixtures.ts";

async function createUser(email: string, firstName = "Test") {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName,
  });
}

async function createHorse(ownerId: string, name: string) {
  return Horse.create({
    name,
    breed: "Thoroughbred",
    sex: "Mare",
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
  });
}

async function createAcceptedRelationship(
  ownerId: string,
  providerUserId: string,
  providerProfileId: string,
) {
  const horse = await createHorse(ownerId, "Review Test");
  const relationship = await Relationship.create({
    horseId: horse._id,
    relationshipType: "veterinary",
    status: "accepted",
    requesterUserId: ownerId,
    receiverAccountType: "veterinary",
    receiverAccountId: providerProfileId,
    receiverUserId: providerUserId,
    respondedAt: new Date(),
    historicalReference: {
      requesterLabel: "Owner",
      horseNameSnapshot: "Review Test",
    },
  });

  return { horse, relationship };
}

describe("reviewService", () => {
  it("creates a review as the horse owner", async () => {
    const owner = await createUser("review-owner@example.com");
    const vetUser = await createUser("review-vet@example.com");
    const veterinary = await createTestVeterinary(String(vetUser._id));
    const { horse, relationship } = await createAcceptedRelationship(
      String(owner._id),
      String(vetUser._id),
      String(veterinary._id),
    );

    const review = await reviewService.createReview(String(owner._id), String(horse._id), {
      relationshipId: String(relationship._id),
      overallScore: 4,
      comment: "Great vet, very thorough!",
    });

    expect(review.overallScore).toBe(4);
    expect(review.comment).toBe("Great vet, very thorough!");
    expect(review.reviewerUserId).toBe(String(owner._id));
    expect(review.revieweeUserId).toBe(String(vetUser._id));
    expect(review.isVerifiedInteraction).toBe(true);
  });

  it("rejects review creation from non-owner", async () => {
    const owner = await createUser("review-stranger-owner@example.com");
    const vetUser = await createUser("review-stranger-vet@example.com");
    const stranger = await createUser("review-stranger@example.com");
    const veterinary = await createTestVeterinary(String(vetUser._id));
    const { horse, relationship } = await createAcceptedRelationship(
      String(owner._id),
      String(vetUser._id),
      String(veterinary._id),
    );

    await expect(
      reviewService.createReview(String(stranger._id), String(horse._id), {
        relationshipId: String(relationship._id),
        overallScore: 3,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects duplicate review for same relationship", async () => {
    const owner = await createUser("review-dup-owner@example.com");
    const vetUser = await createUser("review-dup-vet@example.com");
    const veterinary = await createTestVeterinary(String(vetUser._id));
    const { horse, relationship } = await createAcceptedRelationship(
      String(owner._id),
      String(vetUser._id),
      String(veterinary._id),
    );

    await reviewService.createReview(String(owner._id), String(horse._id), {
      relationshipId: String(relationship._id),
      overallScore: 5,
    });

    await expect(
      reviewService.createReview(String(owner._id), String(horse._id), {
        relationshipId: String(relationship._id),
        overallScore: 3,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("lists reviews for a horse", async () => {
    const owner = await createUser("review-list-owner@example.com");
    const vetUser = await createUser("review-list-vet@example.com");
    const veterinary = await createTestVeterinary(String(vetUser._id));
    const { horse, relationship } = await createAcceptedRelationship(
      String(owner._id),
      String(vetUser._id),
      String(veterinary._id),
    );

    await reviewService.createReview(String(owner._id), String(horse._id), {
      relationshipId: String(relationship._id),
      overallScore: 4,
      comment: "Good service",
    });

    const reviews = await reviewService.listReviewsForHorse(String(horse._id));
    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.overallScore).toBe(4);
  });

  it("responds to a review as the reviewee", async () => {
    const owner = await createUser("review-resp-owner@example.com");
    const vetUser = await createUser("review-resp-vet@example.com");
    const veterinary = await createTestVeterinary(String(vetUser._id));
    const { horse, relationship } = await createAcceptedRelationship(
      String(owner._id),
      String(vetUser._id),
      String(veterinary._id),
    );

    const review = await reviewService.createReview(String(owner._id), String(horse._id), {
      relationshipId: String(relationship._id),
      overallScore: 4,
    });

    const responded = await reviewService.respondToReview(String(vetUser._id), review.id, {
      response: "Thank you for the review!",
    });

    expect(responded.response).toBe("Thank you for the review!");
    expect(responded.respondedAt).toBeDefined();
  });

  it("rejects response from non-reviewee", async () => {
    const owner = await createUser("review-nonresp-owner@example.com");
    const vetUser = await createUser("review-nonresp-vet@example.com");
    const stranger = await createUser("review-nonresp-stranger@example.com");
    const veterinary = await createTestVeterinary(String(vetUser._id));
    const { horse, relationship } = await createAcceptedRelationship(
      String(owner._id),
      String(vetUser._id),
      String(veterinary._id),
    );

    const review = await reviewService.createReview(String(owner._id), String(horse._id), {
      relationshipId: String(relationship._id),
      overallScore: 4,
    });

    await expect(
      reviewService.respondToReview(String(stranger._id), review.id, {
        response: "Not my review!",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
