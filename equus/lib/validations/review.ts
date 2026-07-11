import { z } from "zod";
import { accountTypeEnums, ratingCategoryEnums } from "../../utils/enums.ts";

export const createReviewSchema = z.object({
  relationshipId: z.string().trim().min(1),
  overallScore: z.number().min(0).max(5),
  categoryScores: z
    .array(
      z.object({
        category: z.enum(ratingCategoryEnums),
        score: z.number().min(0).max(5),
      }),
    )
    .max(10)
    .optional(),
  comment: z.string().trim().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const respondToReviewSchema = z.object({
  response: z.string().trim().min(1).max(2000),
});

export type RespondToReviewInput = z.infer<typeof respondToReviewSchema>;

export const listReviewsQuerySchema = z.object({
  status: z.enum(["accepted", "ended"]).optional(),
});
