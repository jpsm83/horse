"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Controller, type Control } from "react-hook-form";

import {
  type HorseInviteLabels,
} from "@/components/shared/horse-invite-section.tsx";
import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { HorsePedigreeParentDialog } from "@/components/horses/profile/horse-pedigree-parent-dialog.tsx";
import { SectionTitleAction } from "@/components/shared/section-title-action.tsx";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useHorseView, useUpdateHorse } from "@/hooks/queries/useHorse.ts";
import { useCreatePedigreeConnection } from "@/hooks/queries/usePedigreeConnection.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { ProfileFormValues } from "@/lib/validations/horseForms.ts";

type HorsePedigreeSectionProps = {
  horseId: string;
  control: Control<ProfileFormValues>;
};

type ParentRole = "sire" | "dam";

type PedigreeParentEntityChipProps = {
  horseId?: string;
  fallbackName: string;
  clearLabel: string;
  clearTooltip?: string;
  clearDisabled?: boolean;
  onClear: () => void;
};

/** Resolves horse view → EntityChip props (keeps EntityChip fetch-free). */
function PedigreeParentEntityChip({
  horseId,
  fallbackName,
  clearLabel,
  clearTooltip,
  clearDisabled,
  onClear,
}: PedigreeParentEntityChipProps) {
  const { data: view } = useHorseView(horseId);
  const parent = view?.horse;
  const title = parent?.name ?? fallbackName;
  const imageUrl = parent?.profileImageUrl;
  const ownerEmail =
    parent?.adminTeam?.find((m) => m.type === "owner")?.email ||
    parent?.adminTeam?.find((m) => m.type === "responsible")?.email ||
    parent?.adminTeam?.[0]?.email;

  return (
    <EntityChip
      entityType="horse"
      entityId={horseId}
      title={title}
      subtitle={ownerEmail || undefined}
      imageUrl={imageUrl}
      clearLabel={clearLabel}
      clearTooltip={clearTooltip}
      clearDisabled={clearDisabled}
      onClear={onClear}
    />
  );
}

export function HorsePedigreeSection({ horseId, control }: HorsePedigreeSectionProps) {
  const t = useTranslations("horseProfile");
  const toast = useAppToast();
  const { data: view } = useHorseView(horseId);
  const horse = view?.horse;
  const createConnection = useCreatePedigreeConnection();
  const updateHorse = useUpdateHorse();
  const [dialogRole, setDialogRole] = useState<ParentRole | null>(null);

  const pedigree = horse?.pedigree as
    | { sireHorseId?: string; sireName?: string; damHorseId?: string; damName?: string }
    | undefined;

  const isConnecting = createConnection.isPending || updateHorse.isPending;

  const baseLabels: Omit<HorseInviteLabels, "inviteLabel" | "horseNameLabel"> = {
    searchPlaceholder: t("searchPlaceholder"),
    searchingLabel: t("searching"),
    searchErrorLabel: t("searchError"),
    noResultsLabel: t("noResults"),
    emailFallbackToggle: t("emailFallbackToggle"),
    emailFallbackHint: t("emailFallbackHint"),
    emailLabel: t("emailLabel"),
    sendInviteLabel: t("sendInvite"),
    cancelLabel: t("cancel"),
  };

  const sireLabels: HorseInviteLabels = {
    ...baseLabels,
    inviteLabel: t("connectAsSire"),
    horseNameLabel: t("sireHorseNameLabel"),
  };

  const damLabels: HorseInviteLabels = {
    ...baseLabels,
    inviteLabel: t("connectAsDam"),
    horseNameLabel: t("damHorseNameLabel"),
  };

  function closeDialog() {
    setDialogRole(null);
  }

  function handleConnect(
    role: ParentRole,
    parentHorseId: string,
    parentHorseName: string,
    _ownerId: string,
  ) {
    createConnection.mutate(
      {
        childHorseId: horseId,
        role,
        parentHorseId,
        parentHorseName,
      },
      {
        onSuccess: () => {
          toast.success(t("pedigreeConnectInvited"));
          closeDialog();
        },
        onError: () => toast.error(t("pedigreeConnectFailed")),
      },
    );
  }

  function handleInviteOwner(role: ParentRole, email: string, horseName: string) {
    createConnection.mutate(
      {
        childHorseId: horseId,
        role,
        invitedEmail: email,
        parentHorseName: horseName,
      },
      {
        onSuccess: () => {
          toast.success(t("pedigreeConnectInvited"));
          closeDialog();
        },
        onError: () => toast.error(t("pedigreeConnectFailed")),
      },
    );
  }

  function handleDisconnect(role: ParentRole) {
    const patch =
      role === "sire"
        ? { pedigree: { sireHorseId: null, sireName: "" } }
        : { pedigree: { damHorseId: null, damName: "" } };
    updateHorse.mutate(
      { horseId, patch },
      {
        onSuccess: () => toast.success(t("pedigreeDisconnected")),
        onError: () => toast.error(t("pedigreeDisconnectFailed")),
      },
    );
  }

  const hasSire = Boolean(pedigree?.sireHorseId || pedigree?.sireName);
  const hasDam = Boolean(pedigree?.damHorseId || pedigree?.damName);

  const dialogLabels = dialogRole === "dam" ? damLabels : sireLabels;
  const dialogTitle =
    dialogRole === "dam" ? t("addDamTitle") : t("addSireTitle");
  const dialogDescription =
    dialogRole === "dam" ? t("addDamDescription") : t("addSireDescription");

  return (
    <FieldGroup>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="w-full space-y-2">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">{t("sireLabel")}</p>
              {!hasSire ? (
                <SectionTitleAction onClick={() => setDialogRole("sire")}>
                  <Plus className="size-3" />
                  {t("add")}
                </SectionTitleAction>
              ) : null}
            </div>
            {hasSire ? (
              <PedigreeParentEntityChip
                horseId={pedigree?.sireHorseId}
                fallbackName={pedigree?.sireName ?? t("sireLabel")}
                clearLabel={t("disconnect")}
                clearTooltip={t("disconnectTooltip")}
                clearDisabled={isConnecting}
                onClear={() => handleDisconnect("sire")}
              />
            ) : null}
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">{t("damLabel")}</p>
              {!hasDam ? (
                <SectionTitleAction onClick={() => setDialogRole("dam")}>
                  <Plus className="size-3" />
                  {t("add")}
                </SectionTitleAction>
              ) : null}
            </div>
            {hasDam ? (
              <PedigreeParentEntityChip
                horseId={pedigree?.damHorseId}
                fallbackName={pedigree?.damName ?? t("damLabel")}
                clearLabel={t("disconnect")}
                clearTooltip={t("disconnectTooltip")}
                clearDisabled={isConnecting}
                onClear={() => handleDisconnect("dam")}
              />
            ) : null}
          </div>
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

      <HorsePedigreeParentDialog
        open={dialogRole !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title={dialogTitle}
        description={dialogDescription}
        isConnecting={isConnecting}
        labels={dialogLabels}
        onConnect={(id, name, ownerId) => {
          if (!dialogRole) return;
          handleConnect(dialogRole, id, name, ownerId);
        }}
        onInviteOwner={(email, name) => {
          if (!dialogRole) return;
          handleInviteOwner(dialogRole, email, name);
        }}
      />
    </FieldGroup>
  );
}
