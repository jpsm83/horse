"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { registerWithCredentials } from "@/lib/api/auth/credentials";
import { resolvePostAuthPath } from "@/lib/navigation/postAuthRedirect.ts";
import { isStaffMembershipRef } from "@/lib/utils/inviteRef.ts";
import {
  authFormMessagesFromTranslations,
  createAuthFormSchemas,
  type SignUpFormValues,
} from "@/lib/validations/authForms.ts";
import { useInvitePreview } from "@/hooks/queries/useInvite";

export function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.signUp");
  const tCommon = useTranslations("common");
  const tInvites = useTranslations("invites.signup");
  const tAuth = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const ref = searchParams.get("ref")?.trim() ?? "";
  const isStaffRef = ref ? isStaffMembershipRef(ref) : false;
  const postAuthPath = resolvePostAuthPath(searchParams.get("next"));

  useRedirectIfAuthenticated(postAuthPath);

  const [apiError, setApiError] = useState<string | null>(null);

  const { data: invitePreview, isError: invitePreviewError } = useInvitePreview(
    ref && !isStaffRef ? ref : undefined,
  );

  const inviteBanner = useMemo(() => {
    if (!ref) return null;
    if (isStaffRef) return tInvites("staffBanner");

    if (invitePreviewError) return tInvites("relationshipBanner");
    if (!invitePreview) return null;

    if (invitePreview.kind === "relationship") {
      const parts = [tInvites("relationshipBanner")];
      if (invitePreview.horseName) {
        parts.push(t("horseLabel", { name: invitePreview.horseName }));
      }
      if (invitePreview.requesterLabel) {
        parts.push(tCommon("from", { label: invitePreview.requesterLabel }));
      }
      return parts.join(" ");
    }

    return tInvites("relationshipBanner");
  }, [ref, isStaffRef, invitePreview, invitePreviewError, t, tCommon, tInvites]);

  const { signUpFormSchema } = useMemo(
    () =>
      createAuthFormSchemas(authFormMessagesFromTranslations((key) => tValidation(key))),
    [tValidation],
  );

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: SignUpFormValues) {
    setApiError(null);

    try {
      await registerWithCredentials({
        email: data.email,
        password: data.password,
        firstName: data.firstName?.trim() || undefined,
        lastName: data.lastName?.trim() || undefined,
        referralReference: ref && !isStaffRef ? ref : undefined,
      });

      if (isStaffRef && ref) {
        router.push(`/workplaces?membership=${encodeURIComponent(ref)}`);
      } else if (ref && !isStaffRef) {
        router.push("/relationships");
      } else {
        router.push(resolvePostAuthPath(searchParams.get("next")));
      }
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t("failed"));
    }
  }

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <>
          {t("hasAccount")}{" "}
          <Link href="/signin" className="font-medium text-foreground underline-offset-4 hover:underline">
            {tCommon("signIn")}
          </Link>
        </>
      }
    >
      {inviteBanner ? (
        <Alert>
          <AlertDescription>{inviteBanner}</AlertDescription>
        </Alert>
      ) : null}

      {apiError ? (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="firstName"
              id="signup-firstName"
              label={tCommon("firstName")}
              autoComplete="given-name"
            />
            <TextField
              control={form.control}
              name="lastName"
              id="signup-lastName"
              label={tCommon("lastName")}
              autoComplete="family-name"
            />
          </div>
          <TextField
            control={form.control}
            name="email"
            id="signup-email"
            label={tCommon("email")}
            type="email"
            autoComplete="email"
          />
          <TextField
            control={form.control}
            name="password"
            id="signup-password"
            label={tCommon("password")}
            type="password"
            autoComplete="new-password"
            description={tAuth("passwordPolicy")}
          />
        </FieldGroup>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>

      <GoogleSignInButton
        disabled={isSubmitting}
        callbackUrl={postAuthPath}
        onError={(message) => setApiError(message)}
      />
    </AuthPageShell>
  );
}
