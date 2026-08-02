/**
 * SubscriptionPageContent — subscription plan list and usage display.
 *
 * Shows the current plan (horse usage bar), all plan tiers, and billing links.
 * Data fetching goes through TanStack Query hooks (`useBilling`,
 * `useCreateCheckout`, `useStripePortal`) — no raw `fetch()`. Plan sections use
 * the shared `Section` component and are wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { SubscriptionPageContentSkeleton } from "@/components/billing/subscription-page-content-skeleton.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth";
import { useBilling, useCreateCheckout, useStripePortal } from "@/hooks/queries/useBilling.ts";
import { SUBSCRIPTION_PLANS, type TierId } from "@/lib/billing/plans";
import { Link } from "@/i18n/navigation";
import { redirectToExternal } from "@/lib/navigation/externalRedirect";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect";

export function SubscriptionPageContent() {
  const t = useTranslations("subscription");
  const { isAuthenticated } = useAppAuth();

  const { data: billing, isPending, isFetching } = useBilling(isAuthenticated);
  const createCheckout = useCreateCheckout();
  const openPortal = useStripePortal();

  async function handleUpgrade(tierId: TierId) {
    if (!isAuthenticated) {
      redirectToExternal(buildSignInPath("/subscription"));
      return;
    }
    try {
      const { url } = await createCheckout.mutateAsync(tierId);
      redirectToExternal(url);
    } catch {
      // Toast error handled by UI
    }
  }

  async function handlePortal() {
    if (!isAuthenticated) {
      redirectToExternal(buildSignInPath("/subscription"));
      return;
    }
    try {
      const { url } = await openPortal.mutateAsync();
      redirectToExternal(url);
    } catch {
      // Toast error handled by UI
    }
  }

  if (isFetching || (isAuthenticated && isPending)) {
    return <SubscriptionPageContentSkeleton suppressHydrationWarning />;
  }

  const tiers = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6" suppressHydrationWarning>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
      </div>

      {/* Current plan summary — only when authenticated */}
      {isAuthenticated && billing ? (
        <Section title={t("currentPlan")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <p className="text-sm text-muted-foreground">
              <span className="capitalize">{billing.tierId}</span> — {billing.current} of{" "}
              {billing.limit === Infinity ? "∞" : billing.limit} {t("horsesUsed")}
            </p>
            <div className="w-full bg-muted rounded-full h-3 mb-4">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{
                  width:
                    billing.limit === Infinity
                      ? "100%"
                      : `${Math.min(100, ((billing.current ?? 0) / (billing.limit ?? 1)) * 100)}%`,
                }}
              />
            </div>
          </SectionErrorBoundary>
        </Section>
      ) : null}

      {/* Plan tiers */}
      <Section title={t("plans")}>
        <SectionErrorBoundary message={t("loadFailed")}>
          <div className="space-y-3">
            {tiers.map((plan) => {
              const isCurrentPlan = isAuthenticated && billing?.tierId === plan.id;
              const planPrice = plan.prices.USD;
              const formattedPrice =
                planPrice === 0 ? "Free" : `$${(planPrice / 100).toFixed(0)}`;

              return (
                <div
                  key={plan.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    isCurrentPlan
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold capitalize">{plan.name}</h3>
                      {isCurrentPlan ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {t("current")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{plan.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {plan.horseLimit === Infinity
                        ? t("unlimitedHorses")
                        : t("upToHorses", { count: plan.horseLimit })}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-semibold">
                        {formattedPrice}
                        {planPrice > 0 && (
                          <span className="text-xs font-normal text-muted-foreground">/mo</span>
                        )}
                      </p>
                    </div>

                    {isCurrentPlan ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="whitespace-nowrap"
                        onClick={handlePortal}
                      >
                        {t("manage")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="whitespace-nowrap"
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {!isAuthenticated
                          ? t("subscribe")
                          : billing?.tierId === "free"
                            ? t("subscribe")
                            : t("change")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionErrorBoundary>
      </Section>

      {/* Payment & billing links — only when authenticated */}
      {isAuthenticated ? (
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={handlePortal}>
            {t("updatePayment")}
          </Button>
          <Button type="button" variant="outline" onClick={handlePortal}>
            {t("billingHistory")}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/signin" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("signInToSubscribe")}
          </Link>
        </p>
      )}
    </div>
  );
}
