"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm, useFormState } from "react-hook-form";
import { Plus, UserCog } from "lucide-react";

import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { HorseAdminRoleInviteDialog } from "@/components/horses/admin/horse-admin-role-invite-dialog.tsx";
import { HorseCoOwnerManagementSection } from "@/components/horses/admin/horse-co-owner-management-section.tsx";
import { HorseOwnershipChangeDialog } from "@/components/horses/admin/horse-ownership-change-dialog.tsx";
import { HorseOwnershipManagementSection } from "@/components/horses/admin/horse-ownership-management-section.tsx";
import { HorseProactiveRepresentativesSection } from "@/components/horses/admin/horse-proactive-representatives-section.tsx";
import { HorseValueSection } from "@/components/horses/admin/horse-value-section.tsx";
import { HorseVisibilitySection } from "@/components/horses/admin/horse-visibility-section.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseSectionVisibility } from "@/components/horses/shared/horse-section-visibility.tsx";
import { Section } from "@/components/shared/section.tsx";
import { SectionTitleAction } from "@/components/shared/section-title-action.tsx";
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

  const [proactiveInviteOpen, setProactiveInviteOpen] = useState(false);
  const [coOwnerInviteOpen, setCoOwnerInviteOpen] = useState(false);
  const [changeOwnerOpen, setChangeOwnerOpen] = useState(false);

  const hubSections = normalizeHubSections(horse.hubSections);
  const isMainOwner = horse.isMainOwner === true;

  const inviteSectionLabels = useMemo(
    () => ({
      searchPlaceholder: t("searchPlaceholder"),
      inviteLabel: t("inviteLabel"),
      searchingLabel: t("searchingLabel"),
      searchErrorLabel: t("searchErrorLabel"),
      noResultsLabel: t("noResultsLabel"),
      emailFallbackToggle: t("emailFallbackToggle"),
      emailFallbackHint: t("emailFallbackHint"),
      emailLabel: t("emailLabel"),
      sendEmailInvite: t("sendEmailInvite"),
      cancelLabel: t("cancel"),
    }),
    [t],
  );

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
    const salePatch = buildSaleSavePatch(
      values,
      dirtyFields as Record<string, boolean | object>,
    );
    const visibilityPatch = buildVisibilitySavePatch(
      values,
      dirtyFields as Record<string, boolean | object>,
    );

    if (
      Object.keys(salePatch).length === 0 &&
      Object.keys(visibilityPatch).length === 0
    ) {
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
    <div className="flex gap-4 w-full">
      <div className="flex min-w-0 flex-col gap-4 w-full">
        <Section
          title={tProfile("sections.visibility")}
          description={tProfile("sectionDescriptions.visibility")}
        >
          <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
            <HorseVisibilitySection control={form.control} />
          </ErrorBoundary>
        </Section>

        <Section
          title={t("ownershipTitle")}
          description={t("ownershipTransferDescription")}
          titleAddon={
            isMainOwner ? (
              <SectionTitleAction onClick={() => setChangeOwnerOpen(true)}>
                <UserCog className="size-3" />
                {t("changeOwner")}
              </SectionTitleAction>
            ) : null
          }
          visibilityControl={
            <HorseSectionVisibility
              horseId={horseId}
              sectionKey="ownership"
              mode={hubSections.ownership.mode}
              uiSectionKey="admin-ownership"
            />
          }
        >
          <div className="min-h-0 flex-1 overflow-auto">
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <HorseOwnershipManagementSection horseId={horseId} />
            </ErrorBoundary>
          </div>
        </Section>
      </div>

      <div className="flex min-w-0 flex-col gap-4 w-full">
        <Section
          title={t("horseValueTitle")}
          description={t("horseValueDescription")}
          className="min-w-0"
          visibilityControl={
            <HorseSectionVisibility
              horseId={horseId}
              sectionKey="value"
              mode={hubSections.value.mode}
              uiSectionKey="admin-value"
            />
          }
        >
          <div className="min-h-0 flex-1 overflow-auto">
            <ErrorBoundary
              fallbackRender={(p) => <InlineErrorFallback {...p} />}
            >
              <HorseValueSection
                control={form.control}
                acquisitionSourceUser={horse.acquisitionSourceUser}
              />
            </ErrorBoundary>
          </div>
        </Section>

        <Section
          title={t("proactiveRepresentativesTitle")}
          description={t("proactiveRepresentativesDescription")}
          className="min-w-0"
          titleAddon={
            isMainOwner ? (
              <SectionTitleAction onClick={() => setProactiveInviteOpen(true)}>
                <Plus className="size-3" />
                {t("add")}
              </SectionTitleAction>
            ) : null
          }
          visibilityControl={
            <HorseSectionVisibility
              horseId={horseId}
              sectionKey="proactiveRepresentatives"
              mode={hubSections.proactiveRepresentatives.mode}
              uiSectionKey="admin-proactive-representatives"
            />
          }
        >
          <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
            <HorseProactiveRepresentativesSection horseId={horseId} />
          </ErrorBoundary>
        </Section>

        <Section
          title={t("coOwnerManagementTitle")}
          description={t("coOwnerManagementDescription")}
          className="min-w-0"
          titleAddon={
            isMainOwner ? (
              <SectionTitleAction onClick={() => setCoOwnerInviteOpen(true)}>
                <Plus className="size-3" />
                {t("add")}
              </SectionTitleAction>
            ) : null
          }
          visibilityControl={
            <HorseSectionVisibility
              horseId={horseId}
              sectionKey="coOwnerManagement"
              mode={hubSections.coOwnerManagement.mode}
              uiSectionKey="admin-co-owner-management"
            />
          }
        >
          <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
            <HorseCoOwnerManagementSection horseId={horseId} />
          </ErrorBoundary>
        </Section>
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
      </div>

      <HorseAdminRoleInviteDialog
        horseId={horseId}
        open={proactiveInviteOpen}
        onOpenChange={setProactiveInviteOpen}
        transferKind="add_responsible"
        title={t("proactiveInviteDialogTitle")}
        description={t("proactiveInviteDialogDescription")}
        successMessage={t("proactiveInvited")}
        inviteSectionLabels={inviteSectionLabels}
      />

      <HorseAdminRoleInviteDialog
        horseId={horseId}
        open={coOwnerInviteOpen}
        onOpenChange={setCoOwnerInviteOpen}
        transferKind="promote_co_owner"
        title={t("coOwnerInviteDialogTitle")}
        description={t("coOwnerInviteDialogDescription")}
        successMessage={t("coOwnerInvited")}
        inviteSectionLabels={inviteSectionLabels}
      />

      <HorseOwnershipChangeDialog
        horseId={horseId}
        open={changeOwnerOpen}
        onOpenChange={setChangeOwnerOpen}
      />
    </div>
  );
}
