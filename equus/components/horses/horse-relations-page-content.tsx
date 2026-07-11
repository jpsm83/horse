"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { useHorseProviders } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useEndRelationship } from "@/hooks/queries/useRelationship.ts";
import { useHorseReviews, useCreateReview, useRespondToReview } from "@/hooks/queries/useReview.ts";
import { useAppToast } from "@/hooks/use-app-toast";
import type { PublicRelationship } from "@/lib/services/relationshipService";
import type { PublicReview } from "@/lib/services/reviewService";

type Props = { horseId: string };

function formatDate(date: Date | undefined, locale: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(date));
}

function ProviderCard({
  relationship,
  isOwner,
  typeLabel,
  locale,
  onEnd,
}: {
  relationship: PublicRelationship;
  isOwner: boolean;
  typeLabel: string;
  locale: string;
  onEnd: (id: string) => void;
}) {
  const t = useTranslations("horseRelations");
  const label = relationship.receiverLabel ?? relationship.invitedEmail ?? typeLabel;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{typeLabel}</p>
        <p className="text-xs text-muted-foreground">
          {relationship.status === "ended" && relationship.endedAt
            ? t("endedLabel", { date: formatDate(relationship.endedAt, locale) })
            : relationship.respondedAt
              ? t("sinceLabel", { date: formatDate(relationship.respondedAt, locale) })
              : null}
        </p>
      </div>
      {isOwner && relationship.status === "accepted" ? (
        <Button variant="outline" size="sm" onClick={() => onEnd(relationship.id)}>
          {t("endButton")}
        </Button>
      ) : null}
    </div>
  );
}

function ReviewCard({
  review,
  isReviewee,
  locale,
}: {
  review: PublicReview;
  isReviewee: boolean;
  locale: string;
}) {
  const t = useTranslations("horseRelations");
  const [showRespondForm, setShowRespondForm] = useState(false);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{review.overallScore}/5</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(review.createdAt, locale)}
          </span>
        </div>
      </div>
      {review.categoryScores && review.categoryScores.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {review.categoryScores.map((cs) => (
            <span key={cs.category} className="rounded bg-muted px-2 py-0.5">
              {cs.category}: {cs.score}/5
            </span>
          ))}
        </div>
      ) : null}
      {review.comment ? (
        <p className="text-sm">{review.comment}</p>
      ) : null}
      {review.response ? (
        <div className="rounded-lg bg-muted p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("responseLabel")}</p>
          <p className="text-sm">{review.response}</p>
          {review.respondedAt ? (
            <p className="text-xs text-muted-foreground">
              {formatDate(review.respondedAt, locale)}
            </p>
          ) : null}
        </div>
      ) : isReviewee ? (
        <div>
          {showRespondForm ? (
            <RespondForm
              reviewId={review.id}
              horseId={review.horseId}
              onClose={() => setShowRespondForm(false)}
            />
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowRespondForm(true)}>
              {t("respondButton")}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RespondForm({
  reviewId,
  horseId,
  onClose,
}: {
  reviewId: string;
  horseId: string;
  onClose: () => void;
}) {
  const t = useTranslations("horseRelations");
  const [response, setResponse] = useState("");
  const respondMutation = useRespondToReview();
  const toast = useAppToast();

  function handleSubmit() {
    if (!response.trim()) return;
    respondMutation.mutate(
      { reviewId, horseId, payload: { response: response.trim() } },
      {
        onSuccess: () => {
          toast.success(t("respondedSuccess"));
          onClose();
        },
        onError: () => {
          toast.error(t("respondError"));
        },
      },
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder={t("respondPlaceholder")}
        maxLength={2000}
        rows={3}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!response.trim() || respondMutation.isPending}>
          {t("respondSubmit")}
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}

function ReviewForm({
  relationshipId,
  horseId,
  onClose,
}: {
  relationshipId: string;
  horseId: string;
  onClose: () => void;
}) {
  const t = useTranslations("horseRelations");
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const createMutation = useCreateReview(horseId);
  const toast = useAppToast();

  function handleSubmit() {
    createMutation.mutate(
      { relationshipId, overallScore: score, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("reviewCreated"));
          onClose();
        },
        onError: () => {
          toast.error(t("reviewError"));
        },
      },
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("scoreLabel")}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`h-8 w-8 rounded text-sm font-medium ${
                n <= score ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
              onClick={() => setScore(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("reviewPlaceholder")}
        maxLength={2000}
        rows={3}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending}>
          {t("reviewSubmit")}
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}

export function HorseRelationsPageContent({ horseId }: Props) {
  const t = useTranslations("horseRelations");
  const tTypes = useTranslations("invites.horseProviders.types");
  const locale = useLocale();
  const { user } = useAppAuth();
  const { data: currentProviders = [] } = useHorseProviders(horseId, "accepted");
  const { data: pastProviders = [] } = useHorseProviders(horseId, "ended");
  const { data: reviews = [] } = useHorseReviews(horseId);
  const endMutation = useEndRelationship();
  const toast = useAppToast();
  const [reviewingRelId, setReviewingRelId] = useState<string | null>(null);

  const reviewedRelIds = new Set(reviews.map((r) => r.relationshipId));
  const currentUserId = user?.id;

  function handleEnd(relationshipId: string) {
    endMutation.mutate(relationshipId, {
      onSuccess: () => {
        toast.success(t("endedSuccess"));
      },
      onError: () => {
        toast.error(t("endError"));
      },
    });
  }

  return (
    <HorsePageShell horseId={horseId} title={t("title")}>
      {({ isOwner }) => (
        <>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("currentProviders")}</h2>
            {currentProviders.length === 0 ? (
              <p className="text-muted-foreground">{t("noCurrentProviders")}</p>
            ) : (
              <div className="space-y-3">
                {currentProviders.map((rel) => (
                  <div key={rel.id}>
                    <ProviderCard
                      relationship={rel}
                      isOwner={isOwner}
                      typeLabel={tTypes(rel.relationshipType)}
                      locale={locale}
                      onEnd={handleEnd}
                    />
                    {isOwner && !reviewedRelIds.has(rel.id) ? (
                      <div className="mt-2 pl-4">
                        {reviewingRelId === rel.id ? (
                          <ReviewForm
                            relationshipId={rel.id}
                            horseId={horseId}
                            onClose={() => setReviewingRelId(null)}
                          />
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setReviewingRelId(rel.id)}>
                            {t("writeReview")}
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("pastProviders")}</h2>
            {pastProviders.length === 0 ? (
              <p className="text-muted-foreground">{t("noPastProviders")}</p>
            ) : (
              <div className="space-y-3">
                {pastProviders.map((rel) => (
                  <div key={rel.id}>
                    <ProviderCard
                      relationship={rel}
                      isOwner={isOwner}
                      typeLabel={tTypes(rel.relationshipType)}
                      locale={locale}
                      onEnd={handleEnd}
                    />
                    {isOwner && !reviewedRelIds.has(rel.id) ? (
                      <div className="mt-2 pl-4">
                        {reviewingRelId === rel.id ? (
                          <ReviewForm
                            relationshipId={rel.id}
                            horseId={horseId}
                            onClose={() => setReviewingRelId(null)}
                          />
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setReviewingRelId(rel.id)}>
                            {t("writeReview")}
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{t("reviewsTitle")}</h2>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">{t("noReviews")}</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => {
                  const isReviewee = currentUserId === review.revieweeUserId;
                  return (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isReviewee={isReviewee}
                      locale={locale}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </HorsePageShell>
  );
}
