/**
 * StableProfileContent — owner profile edit tab (`/stables/[stableId]/profile`).
 *
 * Deferred RHF form (parent-owned `useForm` + one Save) composed of identity,
 * contact, and address sections. Persists via `PATCH /api/v1/stables/:id`.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { StableAddressSection } from "@/components/stable/profile/stable-address-section.tsx";
import { StableContactSection } from "@/components/stable/profile/stable-contact-section.tsx";
import { StableIdentitySection } from "@/components/stable/profile/stable-identity-section.tsx";
import { StablePageShell } from "@/components/stable/stable-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateStableProfile } from "@/hooks/queries/useStableProfile.ts";
import {
  stableProfileFormSchema,
  type StableProfileFormValues,
} from "@/lib/validations/stableForms.ts";
import type { StableViewDto } from "@/lib/services/stableService.ts";

const emptyValues: StableProfileFormValues = {
  tradeName: "",
  description: "",
  email: "",
  phoneNumber: "",
  websiteUrl: "",
  disciplines: [],
  services: [],
  address: { country: "", city: "", state: "", street: "", postCode: "", buildingNumber: "" },
};

export function StableProfileContent({ stableId }: { stableId: string }) {
  return (
    <StablePageShell stableId={stableId} requireOwnership>
      {({ stable }) => <ProfileForm stableId={stableId} initial={stable} />}
    </StablePageShell>
  );
}

function ProfileForm({
  stableId,
  initial,
}: {
  stableId: string;
  initial: StableViewDto;
}) {
  const t = useTranslations("stable.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateStableProfile(stableId);

  const form = useForm<StableProfileFormValues>({
    resolver: zodResolver(stableProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded stable id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      tradeName: initial.tradeName ?? "",
      description: initial.description ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      websiteUrl: initial.websiteUrl ?? "",
      disciplines: (initial.disciplines ?? []) as StableProfileFormValues["disciplines"],
      services: (initial.services ?? []) as StableProfileFormValues["services"],
      address: {
        country: initial.address?.country ?? "",
        city: initial.address?.city ?? "",
        state: initial.address?.state ?? "",
        street: initial.address?.street ?? "",
        postCode: initial.address?.postCode ?? "",
        buildingNumber: initial.address?.buildingNumber ?? "",
      },
    });
  }

  const isSubmitting = form.formState.isSubmitting;

  async function onSave(values: StableProfileFormValues) {
    try {
      await updateProfile.mutateAsync(values);
      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSave)} noValidate>
        <Section title={t("identitySection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <StableIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <StableContactSection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("addressSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <StableAddressSection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <div className="flex">
          <Button type="submit" className="w-full sm:ms-auto sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
