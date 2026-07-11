"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicReview } from "@/lib/services/reviewService";

export type CreateReviewPayload = {
  relationshipId: string;
  overallScore: number;
  categoryScores?: { category: string; score: number }[];
  comment?: string;
};

export type RespondToReviewPayload = {
  response: string;
};

async function fetchReviews(horseId: string): Promise<PublicReview[]> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/reviews`);
  const data = await parseApiResponse<{ reviews: PublicReview[] }>(response);
  return data.reviews;
}

async function createReviewApi(
  horseId: string,
  payload: CreateReviewPayload,
): Promise<PublicReview> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse<{ review: PublicReview }>(response);
  return data.review;
}

async function respondToReviewApi(
  reviewId: string,
  payload: RespondToReviewPayload,
): Promise<PublicReview> {
  const response = await fetchWithAuth(`/api/v1/reviews/${encodeURIComponent(reviewId)}/response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse<{ review: PublicReview }>(response);
  return data.review;
}

type RespondToReviewParams = {
  reviewId: string;
  horseId: string;
  payload: RespondToReviewPayload;
};

export function useHorseReviews(horseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.horses.reviews(horseId!),
    queryFn: () => fetchReviews(horseId!),
    enabled: !!horseId,
  });
}

export function useCreateReview(horseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReviewApi(horseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.reviews(horseId) });
    },
  });
}

export function useRespondToReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RespondToReviewParams) =>
      respondToReviewApi(params.reviewId, params.payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.reviews(variables.horseId) });
    },
  });
}
