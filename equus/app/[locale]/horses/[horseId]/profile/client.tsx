"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm, useFormState } from "react-hook-form";

import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseAboutSection } from "@/components/horses/profile/horse-about-section.tsx";
import { HorseIdentificationSection } from "@/components/horses/profile/horse-identification-section.tsx";
import { HorseIdentitySection } from "@/components/horses/profile/horse-identity-section.tsx";
import { HorsePedigreeSection } from "@/components/horses/profile/horse-pedigree-section.tsx";
import { HorseSectionVisibility } from "@/components/horses/shared/horse-section-visibility.tsx";
import { Section } from "@/components/shared/section.tsx";
import { useUnsavedChanges } from "@/components/shared/unsaved-changes-context.tsx";
import { Button } from "@/components/ui/button";
import type { OwnerHorseSummary } from "@/lib/api/horseClient.ts";
import { normalizeHubSections } from "@/lib/horses/hubSections.ts";
import {
  buildProfileSavePatches,
  emptyProfileFormValues,
  toProfileFormValues,
} from "@/lib/utils/horseProfilePatch.ts";
import {
  horseFormMessagesFromTranslations,
  profileFormSchemas,
  type ProfileFormValues,
} from "@/lib/validations/horseForms.ts";
import { useUpdateHorse } from "@/hooks/queries/useHorse.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type ProfileContentProps = {
  horseId: string;
};

export function ProfileContent({ horseId }: ProfileContentProps) {
  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      {({ horse }) => <ProfileForm horseId={horseId} horse={horse} />}
    </HorsePageShell>
  );
}

type ProfileFormProps = {
  horseId: string;
  horse: OwnerHorseSummary;
};

function ProfileForm({ horseId, horse }: ProfileFormProps) {
  const t = useTranslations("horseProfile");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const updateHorse = useUpdateHorse();
  const { setDirty, setSaving } = useUnsavedChanges();

  const hubSections = normalizeHubSections(horse.hubSections);

  const formMessages = useMemo(() => horseFormMessagesFromTranslations(t), [t]);
  const { profileFormSchema } = useMemo(
    () => profileFormSchemas(formMessages),
    [formMessages],
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: emptyProfileFormValues(),
  });

  useEffect(() => {
    form.reset(toProfileFormValues(horse));
  }, [horse, form]);

  const { isDirty } = useFormState({ control: form.control });
  const isSaving = updateHorse.isPending;

  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    setSaving(isSaving);
  }, [isSaving, setSaving]);

  async function onSave(values: ProfileFormValues) {
    const { horsePatch } = buildProfileSavePatches(
      values,
      form.formState.dirtyFields as Record<string, boolean | object>,
    );

    if (Object.keys(horsePatch).length === 0) {
      toast.info(t("noChanges"));
      return;
    }

    try {
      await updateHorse.mutateAsync({ horseId, patch: horsePatch });
      form.reset(values);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  return (
    <>
      <Section
        title={t("sections.identity")}
        description={t("sectionDescriptions.identity")}
        visibilityControl={
          <HorseSectionVisibility
            horseId={horseId}
            sectionKey="identity"
            mode={hubSections.identity.mode}
            uiSectionKey="profile-identity"
          />
        }
        className="w-full"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseIdentitySection control={form.control} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("sections.identification")}
        description={t("sectionDescriptions.identification")}
        visibilityControl={
          <HorseSectionVisibility
            horseId={horseId}
            sectionKey="identification"
            mode={hubSections.identification.mode}
            uiSectionKey="profile-identification"
          />
        }
        className="w-full"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseIdentificationSection control={form.control} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("sections.pedigree")}
        description={t("sectionDescriptions.pedigree")}
        visibilityControl={
          <HorseSectionVisibility
            horseId={horseId}
            sectionKey="pedigree"
            mode={hubSections.pedigree.mode}
            uiSectionKey="profile-pedigree"
          />
        }
        className="w-full"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorsePedigreeSection horseId={horseId} control={form.control} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("sections.about")}
        description={t("sectionDescriptions.about")}
        visibilityControl={
          <HorseSectionVisibility
            horseId={horseId}
            sectionKey="about"
            mode={hubSections.about.mode}
            uiSectionKey="profile-about"
          />
        }
        className="w-full"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <HorseAboutSection control={form.control} />
        </ErrorBoundary>
      </Section>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={form.handleSubmit(onSave, () => toast.error(t("validationFailed")))}
          disabled={isSaving}
        >
          {isSaving ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </>
  );
}
