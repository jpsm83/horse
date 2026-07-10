"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { SUBSCRIPTION_PLANS, type TierId } from "@/lib/billing/plans";

async function fetchBilling() {
  const res = await fetch("/api/v1/billing/current");
  if (!res.ok) throw new Error("Failed to fetch billing info");
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

  const { data: billing, isPending, error } = useQuery({
    queryKey: ["billing", "current"],
    queryFn: fetchBilling,
  });

  async function handleUpgrade(tierId: TierId) {
    try {
      const { url } = await createCheckout(tierId);
      window.location.href = url;
    } catch {
      // Toast error handled by UI
    }
  }

  async function handlePortal() {
    try {
      const { url } = await openPortal();
      window.location.href = url;
    } catch {
      // Toast error handled by UI
    }
  }

  if (isPending) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-96 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500">Failed to load subscription info.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>

      {/* Current plan summary */}
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

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
          const isCurrentPlan = billing?.tierId === plan.id;
          const planPrice = plan.prices.USD;
          const formattedPrice = planPrice === 0
            ? "Free"
            : `$${(planPrice / 100).toFixed(0)}`;

          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 flex flex-col ${
                isCurrentPlan ? "ring-2 ring-primary border-primary" : ""
              }`}
            >
              <h3 className="text-lg font-bold capitalize mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold mb-1">
                {formattedPrice}
                {planPrice > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                )}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {plan.horseLimit === Infinity ? "Unlimited horses" : `Up to ${plan.horseLimit} horses`}
              </p>
              <p className="text-xs text-muted-foreground mb-4 flex-1">
                {plan.description}
              </p>
              {isCurrentPlan ? (
                <button
                  onClick={handlePortal}
                  className="w-full py-2 px-4 text-sm rounded-md border hover:bg-muted transition-colors"
                >
                  {t("manage")}
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className="w-full py-2 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  disabled={isPending}
                >
                  {billing?.tierId === "free" && plan.id !== "free"
                    ? t("subscribe")
                    : t("change")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment & billing links */}
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
    </div>
  );
}
