"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import { EntityTabs, type EntityTab } from "@/components/ui/entity-tabs.tsx";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type HorseEditPageContentProps = {
  horseId: string;
};

export function HorseEditPageContent({ horseId }: HorseEditPageContentProps) {
  const t = useTranslations("horseEdit");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: horse, isLoading: isHorseLoading } = useOwnerHorse(horseId);
  const [saving, setSaving] = useState(false);

  const isLoading = isAuthLoading || isHorseLoading;

  if (!isLoading && !isAuthenticated) {
    router.replace(buildSignInPath(`/horses/${horseId}/edit`));
    return null;
  }

  if (isLoading || !horse) {
    return <HorseHubPageSkeleton />;
  }

  const isOwner = horse?.isMainOwner === true;
  if (!isOwner) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p>You don't have permission to edit this horse.</p>
        <Link href={`/horses/${horseId}`} className="text-primary underline">Back to hub</Link>
      </div>
    );
  }

  const horseTabs: EntityTab[] = [
    { id: "hub", label: "Hub", href: `/horses/${horseId}` },
    { id: "edit", label: "Edit", href: `/horses/${horseId}/edit`, requireOwnership: true },
    { id: "discovery", label: "Discovery", href: `/horses/${horseId}/discovery`, requireOwnership: true },
    { id: "history", label: "History", href: `/horses/${horseId}/history` },
    { id: "relations", label: "Relations", href: `/horses/${horseId}/relations` },
  ];

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      if (value !== "") body[key] = value;
    }
    try {
      const res = await fetch(`/api/v1/horses/${horseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push(`/horses/${horseId}`);
    } catch {
      // Toast error
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 sm:py-12">
      <EntityTabs tabs={horseTabs} isOwner={isOwner} />

      <div>
        <Link
          href={`/horses/${horseId}`}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl mt-2">{t("title")}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("name")}</label>
          <input
            name="name"
            defaultValue={horse.name}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("breed")}</label>
          <input
            name="breed"
            defaultValue={horse.breed}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <p className="text-sm text-muted-foreground">More fields (description, pedigree, commercial, etc.) coming soon.</p>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? tCommon("saving") : tCommon("save")}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/horses/${horseId}`)}>
            {tCommon("cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
