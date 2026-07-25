"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm, useFormState } from "react-hook-form";

import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { HorseAdminHistorySection } from "@/components/horses/admin/horse-admin-history-section.tsx";
import { HorseCoOwnerManagementSection } from "@/components/horses/admin/horse-co-owner-management-section.tsx";
import { HorseOwnershipManagementSection } from "@/components/horses/admin/horse-ownership-management-section.tsx";
import { HorseProactiveRepresentativesSection } from "@/components/horses/admin/horse-proactive-representatives-section.tsx";
import { HorseValueSection } from "@/components/horses/admin/horse-value-section.tsx";
import { HorseVisibilitySection } from "@/components/horses/admin/horse-visibility-section.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseSectionVisibility } from "@/components/horses/shared/horse-section-visibility.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useUnsavedChanges } from "@/components/shared/unsaved-changes-context.tsx";
import { Button } from "@/components/ui/button";
import type { OwnerHorseSummary } from "@/lib/services/horseService.ts";
import { normalizeHubSections } from "@/lib/horses/hubSections.ts";
import {
  buildSaleSavePatch,
  buildVisibilitySavePatch,
  emptySaleFormValues,
  toSaleFormValues,
} from "@/lib/utils/horseSalePatch.ts";
import {
  horseFormMessagesFromTranslations,
  saleFormSchemas,
  type SaleFormValues,
} from "@/lib/validations/horseForms.ts";
import {
  useUpdateHorseVisibility,
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
  const tProfile = useTranslations("horseProfile");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const updateHorseSale = useUpdateHorseSale();
  const updateVisibility = useUpdateHorseVisibility();
  const { setDirty, setSaving } = useUnsavedChanges();

  const hubSections = normalizeHubSections(horse.hubSections);

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

  const { isDirty, dirtyFields } = useFormState({ control: form.control });
  const isSaving = updateHorseSale.isPending || updateVisibility.isPending;

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    setSaving(isSaving);
  }, [isSaving, setSaving]);

  async function onSave(values: SaleFormValues) {
    const salePatch = buildSaleSavePatch(values, dirtyFields as Record<string, boolean | object>);
    const visibilityPatch = buildVisibilitySavePatch(
      values,
      dirtyFields as Record<string, boolean | object>,
    );

    if (Object.keys(salePatch).length === 0 && Object.keys(visibilityPatch).length === 0) {
      toast.info(tSale("noChanges"));
      return;
    }

    try {
      if (Object.keys(salePatch).length > 0) {
        await updateHorseSale.mutateAsync({ horseId, patch: salePatch });
      }
      if (Object.keys(visibilityPatch).length > 0) {
        await updateVisibility.mutateAsync({ horseId, patch: visibilityPatch });
      }
      form.reset(values);
      toast.success(tSale("saved"));
    } catch {
      toast.error(tSale("saveFailed"));
    }
  }

  return (
    <>
      <Section
        title={t("adminHistoryTitle")}
        description={t("adminHistoryDescription")}
        className="flex-1"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseAdminHistorySection horseId={horseId} />
        </ErrorBoundary>
      </Section>

      <div className="flex items-stretch gap-4">
        <div className="flex w-full min-h-0 flex-col gap-4">
          <Section
            title={t("ownershipTitle")}
            description={t("ownershipTransferDescription")}
            visibilityControl={
              <HorseSectionVisibility
                horseId={horseId}
                sectionKey="ownership"
                mode={hubSections.ownership.mode}
                uiSectionKey="admin-ownership"
              />
            }
            className="min-h-0 flex-1"
          >
            <div className="min-h-0 flex-1 overflow-auto">
              <ErrorBoundary
                fallbackRender={(p) => <InlineErrorFallback {...p} />}
              >
                <HorseOwnershipManagementSection horseId={horseId} />
              </ErrorBoundary>
            </div>
          </Section>

          <Section
            title={t("proactiveRepresentativesTitle")}
            description={t("proactiveRepresentativesDescription")}
            visibilityControl={
              <HorseSectionVisibility
                horseId={horseId}
                sectionKey="proactiveRepresentatives"
                mode={hubSections.proactiveRepresentatives.mode}
                uiSectionKey="admin-proactive-representatives"
              />
            }
            className="shrink-0"
          >
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <HorseProactiveRepresentativesSection horseId={horseId} />
            </ErrorBoundary>
          </Section>

          <Section
            title={t("coOwnerManagementTitle")}
            description={t("coOwnerManagementDescription")}
            visibilityControl={
              <HorseSectionVisibility
                horseId={horseId}
                sectionKey="coOwnerManagement"
                mode={hubSections.coOwnerManagement.mode}
                uiSectionKey="admin-co-owner-management"
              />
            }
            className="shrink-0"
          >
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <HorseCoOwnerManagementSection horseId={horseId} />
            </ErrorBoundary>
          </Section>
        </div>

        <div className="flex w-full min-h-0 flex-col gap-4">
          <Section
            title={tProfile("sections.visibility")}
            description={tProfile("sectionDescriptions.visibility")}
            className="w-full shrink-0"
          >
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <HorseVisibilitySection control={form.control} />
            </ErrorBoundary>
          </Section>

          <Section
            title={t("horseValueTitle")}
            description={t("horseValueDescription")}
            visibilityControl={
              <HorseSectionVisibility
                horseId={horseId}
                sectionKey="value"
                mode={hubSections.value.mode}
                uiSectionKey="admin-value"
              />
            }
            className="min-h-0 w-full flex-1"
          >
            <div className="min-h-0 flex-1 overflow-auto">
              <ErrorBoundary
                fallbackRender={(p) => <InlineErrorFallback {...p} />}
              >
                <HorseValueSection control={form.control} />
              </ErrorBoundary>
            </div>
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
