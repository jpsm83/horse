"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
import { SectionVisibilityPopover } from "@/components/ui/section-visibility-popover.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHorseFeedPlans, useCreateFeedPlan } from "@/hooks/queries/useHorseFeed.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { PublicFeedPlan } from "@/lib/services/horseFeedService";

type Props = { horseId: string };

function HorseFeedPlanForm({ horseId, onSaved }: { horseId: string; onSaved: () => void }) {
  const t = useTranslations("horseFeed");
  const toast = useAppToast();
  const createMutation = useCreateFeedPlan(horseId);
  const [mealTime, setMealTime] = useState("morning");
  const [feedType, setFeedType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedType.trim()) return;
    createMutation.mutate(
      { mealTime, feedType: feedType.trim(), quantity: quantity.trim() || undefined, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("planCreated"));
          onSaved();
          setFeedType("");
          setQuantity("");
          setNotes("");
        },
        onError: () => toast.error(t("planError")),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mealTime">{t("mealTime")}</Label>
          <select
            id="mealTime"
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {["morning", "afternoon", "evening", "night"].map((mt) => (
              <option key={mt} value={mt}>{t(`mealTimes.${mt}`)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="feedType">{t("feedType")}</Label>
          <Input id="feedType" value={feedType} onChange={(e) => setFeedType(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">{t("quantity")}</Label>
        <Input id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g., 2 kg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedNotes">{t("notes")}</Label>
        <textarea
          id="feedNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
        />
      </div>
      <Button type="submit" disabled={createMutation.isPending || !feedType.trim()}>
        {createMutation.isPending ? t("saving") : t("savePlan")}
      </Button>
    </form>
  );
}

export function HorseFeedPageContent({ horseId }: Props) {
  const t = useTranslations("horseFeed");
  const { data: plans = [] } = useHorseFeedPlans(horseId);
  const [showForm, setShowForm] = useState(false);

  const columns: ColumnDef<PublicFeedPlan>[] = [
    {
      id: "mealTime",
      header: t("mealTime"),
      accessorFn: (r) => t(`mealTimes.${r.mealTime}`),
      sortable: true,
      filterable: true,
    },
    {
      id: "feedType",
      header: t("feedType"),
      accessorFn: (r) => r.feedType,
      sortable: true,
      filterable: true,
    },
    {
      id: "quantity",
      header: t("quantity"),
      accessorFn: (r) => (r.quantity ? `${r.quantity} ${r.unit ?? ""}` : "-"),
    },
    {
      id: "supplements",
      header: t("supplements"),
      accessorFn: (r) =>
        r.supplements && r.supplements.length > 0
          ? r.supplements.map((s) => s.name).join(", ")
          : "-",
    },
  ];

  return (
    <HorsePageShell horseId={horseId} title={t("title")} requireOwnership>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("plans")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <SectionVisibilityPopover
          sectionKey="feed"
          current={{ mode: "owner" }}
          onChange={() => {}}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t("cancel") : t("addPlan")}
        </Button>
      </div>

      {showForm && (
        <HorseFeedPlanForm
          horseId={horseId}
          onSaved={() => setShowForm(false)}
        />
      )}

      <DataTable
        columns={columns}
        data={plans}
        filterPlaceholder={t("filterPlaceholder")}
        emptyMessage={t("noPlans")}
      />
    </HorsePageShell>
  );
}
