/**
 * UserVisibilitySection — Layer-1 profile visibility selector.
 *
 * Immediate-action select (saves on change via PATCH /api/v1/users/me).
 * Moved from the Preferences tab to the Profile tab.
 */

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SelectField } from "@/components/forms/select-field.tsx";
import { useUpdateProfile } from "@/hooks/queries/useCurrentUser.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { PublicUser } from "@/lib/services/userService.ts";

type Props = {
  profile: PublicUser;
};

export function UserVisibilitySection({ profile }: Props) {
  const t = useTranslations("profile");
  const toast = useAppToast();
  const updateProfile = useUpdateProfile();
  const [localValue, setLocalValue] = useState<string>(
    profile.preferences?.profileVisibility ?? "public",
  );

  const visibilityOptions = useMemo(
    () => [
      { value: "public", label: t("visibilityOptions.public") },
      { value: "platform", label: t("visibilityOptions.platform") },
      { value: "relationships", label: t("visibilityOptions.relationshipsOnly") },
      { value: "private", label: t("visibilityOptions.private") },
    ],
    [t],
  );

  async function handleChange(next: string) {
    if (next === localValue) return;
    setLocalValue(next);
    try {
      await updateProfile.mutateAsync({
        input: { preferences: { profileVisibility: next as never } },
      });
      toast.success(t("saved"));
    } catch {
      setLocalValue(localValue);
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <SelectField
        id="profile-visibility"
        label={t("profileVisibility")}
        value={localValue}
        onChange={handleChange}
        options={visibilityOptions}
        invalid={false}
      />
    </div>
  );
}
