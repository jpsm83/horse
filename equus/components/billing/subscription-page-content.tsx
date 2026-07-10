"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { SUBSCRIPTION_PLANS, type TierId } from "@/lib/billing/plans";
import { useAppAuth } from "@/hooks/use-app-auth";
import { Link } from "@/i18n/navigation";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect";

async function fetchBilling() {
  const res = await fetch("/api/v1/billing/current");
  if (!res.ok) return null;
  return res.json();
}

async function createCheckout(tierId: string) {
  const res = await fetch("/api/v1/billing/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tierId, currency: "USD" }),
  });
  if (!res.ok) throw new Error("Failed to create checkout");
  return res.json();
}

async function openPortal() {
  const res = await fetch("/api/v1/billing/portal", { method: "POST" });
  if (!res.ok) throw new Error("Failed to open portal");
  return res.json();
}

export function SubscriptionPageContent() {
  const t = useTranslations("subscription");
  const { isAuthenticated } = useAppAuth();

  const { data: billing, isPending, error } = useQuery({
    queryKey: ["billing", "current"],
    queryFn: fetchBilling,
    enabled: isAuthenticated,
  });

  async function handleUpgrade(tierId: TierId) {
    if (!isAuthenticated) {
      window.location.href = buildSignInPath("/subscription");
      return;
    }
    try {
      const { url } = await createCheckout(tierId);
      window.location.href = url;
    } catch {
      // Toast error handled by UI
    }
  }

  async function handlePortal() {
    if (!isAuthenticated) {
      window.location.href = buildSignInPath("/subscription");
      return;
    }
    try {
      const { url } = await openPortal();
      window.location.href = url;
    } catch {
      // Toast error handled by UI
    }
  }

  if (isPending) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-96 mb-8" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded mb-4" />
        ))}
      </div>
    );
  }

  if (error && isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-500">Failed to load subscription info.</p>
      </div>
    );
  }

  const tiers = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {/* Current plan summary — only when authenticated */}
      {isAuthenticated && billing && (
        <section className="mb-8 p-4 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-2">
            {t("currentPlan")}:{" "}
            <span className="capitalize">{billing?.tierId || "Free"}</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {billing?.current ?? 0} of{" "}
            {billing?.limit === Infinity ? "∞" : billing?.limit} {t("horsesUsed")}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-primary h-3 rounded-full transition-all"
              style={{
                width: billing?.limit === Infinity
                  ? "100%"
                  : `${Math.min(100, ((billing?.current ?? 0) / (billing?.limit ?? 1)) * 100)}%`,
              }}
            />
          </div>
        </section>
      )}

      {/* 5 vertical blocks — one per tier */}
      <div className="space-y-3 mb-8">
        {tiers.map((plan) => {
          const isCurrentPlan = isAuthenticated && billing?.tierId === plan.id;
          const planPrice = plan.prices.USD;
          const formattedPrice = planPrice === 0
            ? "Free"
            : `$${(planPrice / 100).toFixed(0)}`;

          return (
            <div
              key={plan.id}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                isCurrentPlan
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold capitalize">{plan.name}</h3>
                  {isCurrentPlan && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {t("current")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {plan.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.horseLimit === Infinity ? "Unlimited horses" : `Up to ${plan.horseLimit} horses`}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xl font-bold">
                    {formattedPrice}
                    {planPrice > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    )}
                  </p>
                </div>

                {isCurrentPlan ? (
                  <button
                    onClick={handlePortal}
                    className="py-2 px-4 text-sm rounded-md border hover:bg-muted transition-colors whitespace-nowrap"
                  >
                    {t("manage")}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className="py-2 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    {!isAuthenticated
                      ? t("subscribe")
                      : billing?.tierId === "free"
                        ? t("subscribe")
                        : t("change")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment & billing links — only when authenticated */}
      {isAuthenticated && (
        <section className="flex gap-4">
          <button
            onClick={handlePortal}
            className="py-2 px-4 text-sm rounded-md border hover:bg-muted transition-colors"
          >
            {t("updatePayment")}
          </button>
          <button
            onClick={handlePortal}
            className="py-2 px-4 text-sm rounded-md border hover:bg-muted transition-colors"
          >
            {t("billingHistory")}
          </button>
        </section>
      )}
    </div>
  );
}
