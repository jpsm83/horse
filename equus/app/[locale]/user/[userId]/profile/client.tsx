"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ProfileDeactivateAccount } from "@/components/profile/profile-deactivate-account.tsx";
import { ProfileForm } from "@/components/profile/profile-form.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingOverlay } from "@/components/shared/loading-overlay.tsx";
import { UserPageShell } from "@/components/user/user-page-shell.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserProfile } from "@/hooks/queries/useCurrentUser.ts";
import { queryKeys } from "@/lib/api/queryKeys";

type ProfileContentProps = {
  userId: string;
};

export function ProfileContent({ userId }: ProfileContentProps) {
  return (
    <UserPageShell userId={userId}>
      <ProfileFormContent />
    </UserPageShell>
  );
}

function ProfileFormContent() {
  const queryClient = useQueryClient();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { user } = useAppAuth();
  const { data: profile, isPending: profileLoading } = useUserProfile(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  if (profileLoading || !user || !profile) {
    return null;
  }

  const personalDetails = (profile.personalDetails ?? {}) as Record<string, unknown>;
  const email =
    typeof personalDetails.email === "string" ? personalDetails.email : user.email;
  const imageUrl =
    typeof personalDetails.imageUrl === "string" ? personalDetails.imageUrl : undefined;
  const hasPassword = profile.hasPassword ?? user.hasPassword ?? false;

  return (
    <div
      className="relative isolate z-0 flex min-h-0 flex-1 flex-col"
      aria-busy={isSaving || isDeactivating}
    >
      <div className="space-y-2 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {!user.profileComplete ? (
        <Alert>
          <AlertDescription>{t("incompleteBanner")}</AlertDescription>
        </Alert>
      ) : null}

      <ProfileForm
        personalDetails={personalDetails}
        email={email}
        emailVerified={user.emailVerified === true}
        authProvider={user.authProvider ?? "credentials"}
        hasPassword={hasPassword}
        imageUrl={imageUrl}
        userType={profile.userType ?? "individual"}
        businessDetails={
          (profile.businessDetails as Record<string, unknown> | undefined) ?? null
        }
        onSavingChange={setIsSaving}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
        }}
      />

      <ProfileDeactivateAccount onDeactivatingChange={setIsDeactivating} />

      <LoadingOverlay
        active={isSaving || isDeactivating}
        label={isDeactivating ? t("deactivateSubmitting") : tCommon("loading")}
      />
    </div>
  );
}
