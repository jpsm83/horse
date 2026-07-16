"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ProfileForm } from "@/components/profile/profile-form.tsx";
import { ProfileDeactivateAccount } from "@/components/profile/profile-deactivate-account.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingOverlay } from "@/components/shared/loading-overlay.tsx";
import { useRouter } from "@/i18n/navigation.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserProfile } from "@/hooks/queries/useCurrentUser.ts";
import { queryKeys } from "@/lib/api/queryKeys";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";

export function ProfilePageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const { user, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data: profile, isPending: profileLoading } = useUserProfile(isAuthenticated);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/profile"));
    }
  }, [authLoading, isAuthenticated, router]);

  const isLoading = authLoading || profileLoading;

  if (isLoading || !user) {
    return <Skeleton className="h-[calc(100vh-5rem)] w-full rounded-none" />;
  }

  const personalDetails = (profile?.personalDetails ?? {}) as Record<string, unknown>;
  const preferences = (profile?.preferences ?? {}) as Record<string, unknown>;
  const email =
    typeof personalDetails.email === "string" ? personalDetails.email : user.email;
  const imageUrl =
    typeof personalDetails.imageUrl === "string" ? personalDetails.imageUrl : undefined;
  const hasPassword = profile?.hasPassword ?? user.hasPassword ?? false;

  return (
    <div
      className="relative isolate z-0 flex min-h-0 flex-1 flex-col"
      aria-busy={isSaving || isDeactivating}
    >
      <div className="mx-auto flex w-full  flex-1 flex-col gap-4 px-4 py-6 sm:gap-6 sm:py-12">
        <div className="space-y-2 pb-4">
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
          preferences={preferences}
          email={email}
          emailVerified={user.emailVerified === true}
          authProvider={user.authProvider ?? "credentials"}
          hasPassword={hasPassword}
          imageUrl={imageUrl}
          userType={profile?.userType ?? "individual"}
          businessDetails={profile?.businessDetails as Record<string, unknown> | undefined ?? null}
          onSavingChange={setIsSaving}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
          }}
        />

        <ProfileDeactivateAccount onDeactivatingChange={setIsDeactivating} />
      </div>

      <LoadingOverlay
        active={isSaving || isDeactivating}
        label={isDeactivating ? t("deactivateSubmitting") : tCommon("loading")}
      />
    </div>
  );
}
