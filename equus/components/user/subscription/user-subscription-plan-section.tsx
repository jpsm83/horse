/**
 * UserSubscriptionPlanSection — current plan info and upgrade CTA.
 *
 * Reads subscription data from the pre-seeded user view.
 * Hardcoded plan details from SUBSCRIPTION_PLANS; structured for future live data.
 */

"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useUserView } from "@/hooks/queries/useCurrentUser.ts";
import { SUBSCRIPTION_PLANS, type TierId } from "@/lib/billing/plans.ts";

type Props = {
  userId: string;
};

const TIER_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  free: "secondary",
  bronze: "outline",
  silver: "outline",
  gold: "default",
  diamond: "default",
};

export function UserSubscriptionPlanSection({ userId }: Props) {
  const t = useTranslations("userSubscription");
  const { data: view } = useUserView(userId);
  const subscription = view?.user?.subscription;

  const tier = (subscription?.tier ?? "free") as TierId;
  const status = subscription?.status ?? "trial";
  const plan = SUBSCRIPTION_PLANS[tier] ?? SUBSCRIPTION_PLANS.free;
  const isUpgradeable = tier === "free" || tier === "bronze";

  return (
    <div className="flex flex-col gap-6">
      {/* Current plan card */}
      <div className="rounded-lg border p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{plan.name}</span>
              <Badge variant={TIER_BADGE_VARIANT[tier] ?? "secondary"}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>
          <Badge variant={status === "active" ? "default" : "secondary"} className="shrink-0">
            {t(`status.${status}`)}
          </Badge>
        </div>

        {/* Plan features */}
        <div className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">{t("horseLimit")}</span>
            <span className="text-sm font-medium">
              {plan.horseLimit === Infinity ? t("unlimited") : plan.horseLimit}
            </span>
          </div>
        </div>

        {subscription?.currentPeriodEnd ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("renewsOn", {
              date: new Date(subscription.currentPeriodEnd).toLocaleDateString(),
            })}
          </p>
        ) : null}

        {subscription?.trialEndsAt && status === "trial" ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("trialEndsOn", {
              date: new Date(subscription.trialEndsAt).toLocaleDateString(),
            })}
          </p>
        ) : null}
      </div>

      {/* Upgrade CTA */}
      {isUpgradeable ? (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm font-medium">{t("upgradeCallout")}</p>
          <p className="text-sm text-muted-foreground">{t("upgradeDescription")}</p>
          <Button className="w-full sm:w-auto" variant="default" disabled>
            {t("upgradeButton")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("upgradeComingSoon")}</p>
        </div>
      ) : null}
    </div>
  );
}
