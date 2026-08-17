/**
 * StableBillingSection — entity subscription status and Stripe actions on Admin tab.
 *
 * Shows trial/paid state, roster meter, and checkout/portal links for the main owner.
 * Data via `useEntityBilling` → `/api/v1/billing/current?stableId=`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { Button } from "@/components/ui/button";
import {
  useCreateEntityCheckout,
  useEntityBilling,
  useEntityStripePortal,
} from "@/hooks/queries/useBilling.ts";
import { ENTITY_CATALOG_BANDS } from "@/lib/billing/entityCatalog.ts";
import { redirectToExternal } from "@/lib/navigation/externalRedirect";

type StableBillingSectionProps = {
  stableId: string;
};

function formatPrice(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(0);
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount}`;
}

export function StableBillingSection({ stableId }: StableBillingSectionProps) {
  const t = useTranslations("stable.billing");
  const { data: billing, isPending, isFetching } = useEntityBilling(stableId);
  const createCheckout = useCreateEntityCheckout();
  const openPortal = useEntityStripePortal();

  async function handleSubscribe() {
    try {
      const { url } = await createCheckout.mutateAsync({ stableId });
      if (url) redirectToExternal(url);
    } catch {
      // UI surfaces errors via mutation state if needed
    }
  }

  async function handlePortal() {
    try {
      const { url } = await openPortal.mutateAsync(stableId);
      if (url) redirectToExternal(url);
    } catch {
      // UI surfaces errors via mutation state if needed
    }
  }

  if (isPending || isFetching || !billing) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  const bandLabel = ENTITY_CATALOG_BANDS[billing.catalogBand]?.name ?? billing.catalogBand;
  const statusLabel =
    billing.status === "trialing"
      ? t("statusTrialing")
      : billing.inGoodStanding
        ? t("statusGoodStanding")
        : t("statusWriteLocked");

  return (
    <SectionErrorBoundary message={t("loadFailed")}>
      <div className="space-y-4">
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm">
            <span className="font-medium">{t("status")}:</span> {statusLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("planBand", { band: bandLabel })} —{" "}
            {formatPrice(billing.monthlyPriceCents, billing.currency)}
            {t("perMonth")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("rosterCount", { count: billing.rosterCount })}
            {billing.suggestedBand !== billing.catalogBand
              ? ` (${t("suggestedBand", { band: ENTITY_CATALOG_BANDS[billing.suggestedBand]?.name ?? billing.suggestedBand })})`
              : ""}
          </p>
          {billing.trialEndsAt ? (
            <p className="text-sm text-muted-foreground">
              {t("trialEnds", {
                date: new Date(billing.trialEndsAt).toLocaleDateString(),
              })}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {billing.hasStripeSubscription ? (
            <Button type="button" variant="outline" onClick={handlePortal}>
              {t("manageBilling")}
            </Button>
          ) : (
            <Button type="button" onClick={handleSubscribe}>
              {billing.status === "trialing" ? t("subscribeAfterTrial") : t("subscribe")}
            </Button>
          )}
        </div>

        {!billing.inGoodStanding ? (
          <p className="text-sm text-destructive">{t("writeLockedHint")}</p>
        ) : null}
      </div>
    </SectionErrorBoundary>
  );
}
