"use client";

/**
 * Auth-gated profile page — loads user data and renders ProfileForm.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { ProfileForm } from "@/components/profile/profile-form.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "@/i18n/navigation.ts";
import { fetchCurrentUser, fetchUserProfile } from "@/lib/api/authClient.ts";
import type { AuthUser } from "@/lib/auth/types.ts";

export function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [personalDetails, setPersonalDetails] = useState<Record<string, unknown> | null>(
    null,
  );
  const [hasPassword, setHasPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      const profileResult = await fetchUserProfile();
      setUser(currentUser);
      setPersonalDetails(profileResult.user.personalDetails);
      setHasPassword(
        profileResult.user.hasPassword ?? currentUser.hasPassword ?? false,
      );
    } catch {
      router.replace("/signin?next=%2Fprofile");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12">
        <Alert>
          <AlertDescription>{tCommon("loading")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user || !personalDetails) {
    return null;
  }

  const email =
    typeof personalDetails.email === "string" ? personalDetails.email : user.email;
  const imageUrl =
    typeof personalDetails.imageUrl === "string" ? personalDetails.imageUrl : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
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
      />
    </div>
  );
}
