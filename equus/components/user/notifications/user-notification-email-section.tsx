/**
 * UserNotificationEmailSection — email notification preference toggles.
 *
 * Each toggle fires an immediate PATCH (no deferred Save button).
 * Reads from queryKeys.users.notifications(userId).
 */

"use client";

import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/queries/useCurrentUser.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type Props = {
  userId: string;
};

const EMAIL_TOGGLE_KEYS = [
  "relationshipRequests",
  "ownershipTransfers",
  "workplaceInvitations",
  "messages",
  "system",
] as const;

type EmailKey = (typeof EMAIL_TOGGLE_KEYS)[number];

export function UserNotificationEmailSection({ userId }: Props) {
  const t = useTranslations("userNotifications");
  const toast = useAppToast();
  const { data: prefs, isPending } = useNotificationPreferences(userId);
  const updatePrefs = useUpdateNotificationPreferences(userId);

  async function handleToggle(key: EmailKey, checked: boolean) {
    try {
      await updatePrefs.mutateAsync({ email: { [key]: checked } });
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {EMAIL_TOGGLE_KEYS.map((key) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const email = prefs?.email ?? {};

  return (
    <div className="flex flex-col gap-4">
      {EMAIL_TOGGLE_KEYS.map((key) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={`notify-${key}`} className="text-sm font-medium">
              {t(`email.${key}.label`)}
            </Label>
            <p className="text-xs text-muted-foreground">{t(`email.${key}.description`)}</p>
          </div>
          <Switch
            id={`notify-${key}`}
            checked={(email[key] as boolean | undefined) ?? true}
            onCheckedChange={(checked) => void handleToggle(key, checked)}
            disabled={updatePrefs.isPending}
          />
        </div>
      ))}
    </div>
  );
}
