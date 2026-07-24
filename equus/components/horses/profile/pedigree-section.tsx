"use client";

import { useTranslations } from "next-intl";
import { Controller, type Control } from "react-hook-form";

import { HorseInviteSection, type HorseInviteLabels } from "@/components/shared/horse-invite-section.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useOwnerHorse, useUpdateHorse } from "@/hooks/queries/useHorse.ts";
import { useCreatePedigreeConnection } from "@/hooks/queries/usePedigreeConnection.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { ProfileFormValues } from "@/lib/validations/horseForms.ts";

type PedigreeSectionProps = {
  horseId: string;
  control: Control<ProfileFormValues>;
};

export function PedigreeSection({ horseId, control }: PedigreeSectionProps) {
  const t = useTranslations("horseProfile");
  const toast = useAppToast();
  const { data: horse } = useOwnerHorse(horseId);
  const createConnection = useCreatePedigreeConnection();
  const updateHorse = useUpdateHorse();

  const pedigree = horse?.pedigree as
    | { sireHorseId?: string; sireName?: string; damHorseId?: string; damName?: string }
    | undefined;

  const sireLabels: HorseInviteLabels = {
    searchPlaceholder: t("searchPlaceholder"),
    inviteLabel: t("connectAsSire"),
    connectedLabel: t("connected"),
    disconnectLabel: t("disconnect"),
    searchingLabel: t("searching"),
    searchErrorLabel: t("searchError"),
    noResultsLabel: t("noResults"),
    emailFallbackToggle: t("emailFallbackToggle"),
    emailFallbackHint: t("emailFallbackHint"),
    emailLabel: t("emailLabel"),
    horseNameLabel: t("sireHorseNameLabel"),
    sendInviteLabel: t("sendInvite"),
    cancelLabel: t("cancel"),
  };

  const damLabels: HorseInviteLabels = {
    ...sireLabels,
    inviteLabel: t("connectAsDam"),
    horseNameLabel: t("damHorseNameLabel"),
  };

  function handleConnectSire(parentHorseId: string, parentHorseName: string, _ownerId: string) {
    createConnection.mutate(
      {
        childHorseId: horseId,
        role: "sire",
        parentHorseId,
        parentHorseName,
      },
      {
        onSuccess: () => toast.success(t("pedigreeConnectInvited")),
        onError: () => toast.error(t("pedigreeConnectFailed")),
      },
    );
  }

  function handleInviteSireOwner(email: string, horseName: string) {
    createConnection.mutate(
      {
        childHorseId: horseId,
        role: "sire",
        invitedEmail: email,
        parentHorseName: horseName,
      },
      {
        onSuccess: () => toast.success(t("pedigreeConnectInvited")),
        onError: () => toast.error(t("pedigreeConnectFailed")),
      },
    );
  }

  function handleDisconnectSire() {
    updateHorse.mutate(
      { horseId, patch: { pedigree: { sireHorseId: null, sireName: "" } } },
      {
        onSuccess: () => toast.success(t("pedigreeDisconnected")),
        onError: () => toast.error(t("pedigreeDisconnectFailed")),
      },
    );
  }

  function handleConnectDam(parentHorseId: string, parentHorseName: string, _ownerId: string) {
    createConnection.mutate(
      {
        childHorseId: horseId,
        role: "dam",
        parentHorseId,
        parentHorseName,
      },
      {
        onSuccess: () => toast.success(t("pedigreeConnectInvited")),
        onError: () => toast.error(t("pedigreeConnectFailed")),
      },
    );
  }

  function handleInviteDamOwner(email: string, horseName: string) {
    createConnection.mutate(
      {
        childHorseId: horseId,
        role: "dam",
        invitedEmail: email,
        parentHorseName: horseName,
      },
      {
        onSuccess: () => toast.success(t("pedigreeConnectInvited")),
        onError: () => toast.error(t("pedigreeConnectFailed")),
      },
    );
  }

  function handleDisconnectDam() {
    updateHorse.mutate(
      { horseId, patch: { pedigree: { damHorseId: null, damName: "" } } },
      {
        onSuccess: () => toast.success(t("pedigreeDisconnected")),
        onError: () => toast.error(t("pedigreeDisconnectFailed")),
      },
    );
  }

  return (
    <FieldGroup>
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium">{t("sireLabel")}</p>
          <HorseInviteSection
            currentHorseId={pedigree?.sireHorseId}
            currentHorseName={pedigree?.sireName}
            isConnecting={createConnection.isPending || updateHorse.isPending}
            onConnect={handleConnectSire}
            onInviteOwner={handleInviteSireOwner}
            onDisconnect={handleDisconnectSire}
            labels={sireLabels}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">{t("damLabel")}</p>
          <HorseInviteSection
            currentHorseId={pedigree?.damHorseId}
            currentHorseName={pedigree?.damName}
            isConnecting={createConnection.isPending || updateHorse.isPending}
            onConnect={handleConnectDam}
            onInviteOwner={handleInviteDamOwner}
            onDisconnect={handleDisconnectDam}
            labels={damLabels}
          />
        </div>

        <Controller
          name="pedigree.bloodlineNotes"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-bloodlineNotes">{t("bloodlineNotes")}</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="profile-bloodlineNotes"
                rows={3}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </div>
    </FieldGroup>
  );
}
