/**
 * TransportProfileContent — owner profile edit tab
 * (`/transport/[transportId]/profile`).
 *
 * Deferred RHF form (parent-owned `useForm` + one Save) composed of identity,
 * contact, and address sections. Persists via `PATCH /api/v1/transports/:id`.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { TransportAddressSection } from "@/components/transport/profile/transport-address-section.tsx";
import { TransportContactSection } from "@/components/transport/profile/transport-contact-section.tsx";
import { TransportIdentitySection } from "@/components/transport/profile/transport-identity-section.tsx";
import { TransportPageShell } from "@/components/transport/transport-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateTransportProfile } from "@/hooks/queries/useTransportProfile.ts";
import {
  transportProfileFormSchema,
  type TransportProfileFormValues,
} from "@/lib/validations/transportForms.ts";
import type { TransportViewDto } from "@/lib/services/transportService.ts";

const emptyValues: TransportProfileFormValues = {
  companyName: "",
  description: "",
  email: "",
  phoneNumber: "",
  emergencyPhoneNumber: "",
  websiteUrl: "",
  specialties: [],
  serviceAreas: [],
  address: { country: "", city: "", state: "", street: "", postCode: "", buildingNumber: "" },
};

export function TransportProfileContent({ transportId }: { transportId: string }) {
  return (
    <TransportPageShell transportId={transportId} requireOwnership>
      {({ transport }) => <ProfileForm transportId={transportId} initial={transport} />}
    </TransportPageShell>
  );
}

function ProfileForm({
  transportId,
  initial,
}: {
  transportId: string;
  initial: TransportViewDto;
}) {
  const t = useTranslations("transport.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateTransportProfile(transportId);

  const form = useForm<TransportProfileFormValues>({
    resolver: zodResolver(transportProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded transport id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      companyName: initial.companyName ?? "",
      description: initial.description ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      emergencyPhoneNumber: initial.emergencyPhoneNumber ?? "",
      websiteUrl: initial.websiteUrl ?? "",
      specialties: (initial.specialties ?? []) as TransportProfileFormValues["specialties"],
      serviceAreas: (initial.serviceAreas ?? []) as TransportProfileFormValues["serviceAreas"],
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

  async function onSave(values: TransportProfileFormValues) {
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
            <TransportIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <TransportContactSection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("addressSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <TransportAddressSection control={form.control} />
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
