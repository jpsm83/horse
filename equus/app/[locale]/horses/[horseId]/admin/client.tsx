"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm, useFormState } from "react-hook-form";

import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { AdminHistorySection } from "@/components/horses/ownership/admin-history-section.tsx";
import { CoOwnerManagementSection } from "@/components/horses/ownership/co-owner-management-section.tsx";
import { HorseValueSection } from "@/components/horses/ownership/horse-value-section.tsx";
import { OwnershipManagementSection } from "@/components/horses/ownership/ownership-management-section.tsx";
import { ProactiveRepresentativesSection } from "@/components/horses/ownership/proactive-representatives-section.tsx";
import { DiscoverySection } from "@/components/horses/profile/discovery-section.tsx";
import { Section } from "@/components/shared/section.tsx";
import type { SectionVisibility } from "@/components/shared/section-visibility-popover.tsx";
import { useUnsavedChanges } from "@/components/shared/unsaved-changes-context.tsx";
import { Button } from "@/components/ui/button";
import type { OwnerHorseSummary } from "@/lib/api/horseClient.ts";
import {
  buildSaleSavePatch,
  emptySaleFormValues,
  toSaleFormValues,
} from "@/lib/utils/horseSalePatch.ts";
import {
  horseFormMessagesFromTranslations,
  profileFormSchemas,
  saleFormSchemas,
  type DiscoveryFormValues,
  type SaleFormValues,
} from "@/lib/validations/horseForms.ts";
import {
  useUpdateHorseDiscovery,
  useUpdateHorseSale,
} from "@/hooks/queries/useHorse.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type AdminContentProps = {
  horseId: string;
};

export function AdminContent({ horseId }: AdminContentProps) {
  return (
    <HorsePageShell horseId={horseId} requireOwnership requireMainOwner>
      {({ horse }) => <AdminForm horseId={horseId} horse={horse} />}
    </HorsePageShell>
  );
}

type AdminFormProps = {
  horseId: string;
  horse: OwnerHorseSummary;
};

function AdminForm({ horseId, horse }: AdminFormProps) {
  const t = useTranslations("horseAdmin");
  const tSale = useTranslations("horseSale");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const updateHorseSale = useUpdateHorseSale();
  const updateDiscovery = useUpdateHorseDiscovery();
  const { setDirty, setSaving } = useUnsavedChanges();

  const [valueVisibility, setValueVisibility] = useState<SectionVisibility>({
    mode: "owner",
  });
  const [ownershipVisibility, setOwnershipVisibility] =
    useState<SectionVisibility>({
      mode: "owner",
    });
  const [
    proactiveRepresentativesVisibility,
    setProactiveRepresentativesVisibility,
  ] = useState<SectionVisibility>({
    mode: "owner",
  });
  const [coOwnerManagementVisibility, setCoOwnerManagementVisibility] =
    useState<SectionVisibility>({
      mode: "owner",
    });

  const formMessages = useMemo(
    () => horseFormMessagesFromTranslations(tSale),
    [tSale],
  );
  const { saleFormSchema } = useMemo(
    () => saleFormSchemas(formMessages),
    [formMessages],
  );

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: emptySaleFormValues(),
  });

  useEffect(() => {
    form.reset(toSaleFormValues(horse));
  }, [horse, form]);

  const { isDirty } = useFormState({ control: form.control });
  const isSaving = updateHorseSale.isPending || updateDiscovery.isPending;

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    setSaving(isSaving);
  }, [isSaving, setSaving]);

  async function onSave(values: SaleFormValues) {
    const patch = buildSaleSavePatch(
      values,
      form.formState.dirtyFields as Record<string, boolean | object>,
    );

    if (Object.keys(patch).length === 0) {
      toast.info(tSale("noChanges"));
      return;
    }

    try {
      await updateHorseSale.mutateAsync({ horseId, patch });
      form.reset(values);
      toast.success(tSale("saved"));
    } catch {
      toast.error(tSale("saveFailed"));
    }
  }

  const tProfile = useTranslations("horseProfile");
  const profileFormMessages = useMemo(
    () => horseFormMessagesFromTranslations(tProfile),
    [tProfile],
  );
  const { discoveryFormSchema } = useMemo(
    () => profileFormSchemas(profileFormMessages),
    [profileFormMessages],
  );

  const discoveryForm = useForm<DiscoveryFormValues>({
    resolver: zodResolver(discoveryFormSchema),
    defaultValues: { profileVisibility: "public" },
  });

  useEffect(() => {
    discoveryForm.reset({
      profileVisibility: (horse.profileVisibility ??
        "public") as DiscoveryFormValues["profileVisibility"],
    });
  }, [horse, discoveryForm]);

  async function onDiscoverySave(values: DiscoveryFormValues) {
    try {
      await updateDiscovery.mutateAsync({
        horseId,
        patch: { profileVisibility: values.profileVisibility },
      });
      discoveryForm.reset(values);
      toast.success(tProfile("saved"));
    } catch {
      toast.error(tProfile("saveFailed"));
    }
  }

  const [discoveryVisibility, setDiscoveryVisibility] =
    useState<SectionVisibility>({ mode: "owner" });

  return (
    <>
      <Section
        title={t("adminHistoryTitle")}
        description={t("adminHistoryDescription")}
        className="flex-1"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <AdminHistorySection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <div className="flex gap-4 justify-between">
        <div className="flex flex-col gap-4 w-full">
        <Section
            title={t("ownershipTitle")}
            description={t("ownershipTransferDescription")}
            sectionKey="admin-ownership"
            visibility={ownershipVisibility}
            onVisibilityChange={setOwnershipVisibility}
            className="w-full"
          >
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <OwnershipManagementSection horseId={horseId} />
            </ErrorBoundary>
          </Section>

          <Section
            title={t("proactiveRepresentativesTitle")}
            description={t("proactiveRepresentativesDescription")}
            sectionKey="admin-proactive-representatives"
            visibility={proactiveRepresentativesVisibility}
            onVisibilityChange={setProactiveRepresentativesVisibility}
            className="w-full"
          >
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <ProactiveRepresentativesSection horseId={horseId} />
            </ErrorBoundary>
          </Section>

          <Section
            title={t("coOwnerManagementTitle")}
            description={t("coOwnerManagementDescription")}
            sectionKey="admin-co-owner-management"
            visibility={coOwnerManagementVisibility}
            onVisibilityChange={setCoOwnerManagementVisibility}
            className="w-full"
          >
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <CoOwnerManagementSection horseId={horseId} />
            </ErrorBoundary>
          </Section>
        </div>

        <div className="flex flex-col gap-4 w-full">
        <Section
            title={tProfile("sections.discovery")}
            description={tProfile("sectionDescriptions.discovery")}
            className="w-full"
          >
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <DiscoverySection control={discoveryForm.control} />
            </ErrorBoundary>
          </Section>

          <Section
            title={t("horseValueTitle")}
            description={t("horseValueDescription")}
            sectionKey="admin-value"
            visibility={valueVisibility}
            onVisibilityChange={setValueVisibility}
            className="w-full h-full flex-1"
          >
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <HorseValueSection control={form.control} />
            </ErrorBoundary>
          </Section>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={form.handleSubmit(onSave, () =>
            toast.error(tSale("validationFailed")),
          )}
          disabled={isSaving}
        >
          {isSaving ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </>
  );
}
