"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm, useFormState } from "react-hook-form";

import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { AboutSection } from "@/components/horses/profile/about-section.tsx";
import { DisciplinesSection } from "@/components/horses/profile/disciplines-section.tsx";
import { IdentificationSection } from "@/components/horses/profile/identification-section.tsx";
import { IdentitySection } from "@/components/horses/profile/identity-section.tsx";
import { PedigreeSection } from "@/components/horses/profile/pedigree-section.tsx";
import { Section } from "@/components/shared/section.tsx";
import type { SectionVisibility } from "@/components/shared/section-visibility-popover.tsx";
import { useUnsavedChanges } from "@/components/shared/unsaved-changes-context.tsx";
import { Button } from "@/components/ui/button";
import type { OwnerHorseSummary } from "@/lib/api/horseClient.ts";
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

  const [identityVisibility, setIdentityVisibility] = useState<SectionVisibility>({
    mode: "owner",
  });
  const [identificationVisibility, setIdentificationVisibility] = useState<SectionVisibility>({
    mode: "owner",
  });
  const [disciplinesVisibility, setDisciplinesVisibility] = useState<SectionVisibility>({
    mode: "owner",
  });
  const [pedigreeVisibility, setPedigreeVisibility] = useState<SectionVisibility>({
    mode: "owner",
  });
  const [aboutVisibility, setAboutVisibility] = useState<SectionVisibility>({
    mode: "owner",
  });

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
        sectionKey="profile-identity"
        visibility={identityVisibility}
        onVisibilityChange={setIdentityVisibility}
        className="w-full"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <IdentitySection control={form.control} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("sections.identification")}
        description={t("sectionDescriptions.identification")}
        sectionKey="profile-identification"
        visibility={identificationVisibility}
        onVisibilityChange={setIdentificationVisibility}
        className="w-full"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <IdentificationSection control={form.control} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("sections.disciplines")}
        description={t("sectionDescriptions.disciplines")}
        sectionKey="profile-disciplines"
        visibility={disciplinesVisibility}
        onVisibilityChange={setDisciplinesVisibility}
        className="w-full"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <DisciplinesSection control={form.control} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("sections.pedigree")}
        description={t("sectionDescriptions.pedigree")}
        sectionKey="profile-pedigree"
        visibility={pedigreeVisibility}
        onVisibilityChange={setPedigreeVisibility}
        className="w-full"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <PedigreeSection horseId={horseId} control={form.control} />
        </ErrorBoundary>
      </Section>

      <Section
        title={t("sections.about")}
        description={t("sectionDescriptions.about")}
        sectionKey="profile-about"
        visibility={aboutVisibility}
        onVisibilityChange={setAboutVisibility}
        className="w-full"
      >
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <AboutSection control={form.control} />
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
