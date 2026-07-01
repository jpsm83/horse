"use client";

/**
 * Profile page body — loads REST data after mount and renders the form.
 * Uses skeleton (not `use()`) because auth fetch requires browser cookies.
 */

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ProfileForm } from "@/components/profile/profile-form.tsx";
import { ProfileDeactivateAccount } from "@/components/profile/profile-deactivate-account.tsx";
import { ProfilePageSkeleton } from "@/components/profile/profile-page-skeleton.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { useRouter } from "@/i18n/navigation.ts";
import {
  createProfilePageDataPromise,
  type ProfilePageData,
} from "@/lib/profile/loadProfilePageData.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { AuthUser } from "@/lib/auth/types.ts";
import type { PublicUser } from "@/lib/services/userService.ts";

export function ProfilePageContent() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const [data, setData] = useState<ProfilePageData | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [personalDetails, setPersonalDetails] = useState<Record<string, unknown> | null>(
    null,
  );
  const [preferences, setPreferences] = useState<Record<string, unknown> | null>(
    null,
  );
  const [hasPassword, setHasPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    createProfilePageDataPromise(() => {
      router.replace(buildSignInPath("/profile"));
    }).then((result) => {
      if (cancelled) return;
      setData(result);
      setUser(result.currentUser);
      setPersonalDetails(result.profileResult.user.personalDetails);
      setPreferences(result.profileResult.user.preferences as Record<string, unknown>);
      setHasPassword(
        result.profileResult.user.hasPassword ?? result.currentUser.hasPassword ?? false,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!data || !user || !personalDetails || !preferences) {
    return <ProfilePageSkeleton />;
  }

  const email =
    typeof personalDetails.email === "string" ? personalDetails.email : user.email;
  const imageUrl =
    typeof personalDetails.imageUrl === "string" ? personalDetails.imageUrl : undefined;

  return (
    <div
      className="relative isolate z-0 flex min-h-0 flex-1 flex-col"
      aria-busy={isSaving || isDeactivating}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:gap-6 sm:py-12">
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
          onSavingChange={setIsSaving}
          onSaved={(savedUser: PublicUser) => {
            setPersonalDetails(savedUser.personalDetails);
            setPreferences(savedUser.preferences as Record<string, unknown>);
            setHasPassword(savedUser.hasPassword);
            setUser((prev) =>
              prev
                ? {
                    ...prev,
                    emailVerified: savedUser.emailVerified,
                    profileComplete: savedUser.profileComplete,
                  }
                : prev,
            );
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
