"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Link, usePathname, useRouter } from "@/i18n/navigation.ts";
import { normalizeLocale } from "@/i18n/resolveLocale.ts";
import { isApiClientError, loginWithCredentials } from "@/lib/api/authClient.ts";
import {
  authFormMessagesFromTranslations,
  createAuthFormSchemas,
  type SignInFormValues,
} from "@/lib/validations/authForms.ts";

export default function SignInPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("auth.signIn");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const [apiError, setApiError] = useState<string | null>(null);
  const [showResendLink, setShowResendLink] = useState(false);

  const { signInFormSchema } = useMemo(
    () =>
      createAuthFormSchemas(authFormMessagesFromTranslations((key) => tValidation(key))),
    [tValidation],
  );

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: SignInFormValues) {
    setApiError(null);
    setShowResendLink(false);

    try {
      const session = await loginWithCredentials(data.email, data.password);

      const preferred = normalizeLocale(session.user.preferredLanguage);
      if (preferred !== normalizeLocale(locale)) {
        router.replace(pathname, { locale: preferred });
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      if (isApiClientError(err) && err.code === "EMAIL_NOT_VERIFIED") {
        setApiError(tErrors("EMAIL_NOT_VERIFIED"));
        setShowResendLink(true);
        return;
      }
      setApiError(err instanceof Error ? err.message : t("failed"));
    }
  }

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            {tCommon("signUp")}
          </Link>
        </>
      }
    >
      {apiError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {apiError}
            {showResendLink ? (
              <>
                {" "}
                <Link href="/resend-confirmation" className="underline underline-offset-4">
                  {t("resendConfirmation")}
                </Link>
              </>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <TextField
            control={form.control}
            name="email"
            id="signin-email"
            label={tCommon("email")}
            type="email"
            autoComplete="email"
          />
          <div className="space-y-1">
            <TextField
              control={form.control}
              name="password"
              id="signin-password"
              label={tCommon("password")}
              type="password"
              autoComplete="current-password"
            />
            <p className="text-right text-sm">
              <Link
                href="/forgot-password"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </p>
          </div>
        </FieldGroup>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/resend-confirmation" className="underline-offset-4 hover:underline">
          {t("resendConfirmation")}
        </Link>
      </p>

      <GoogleSignInButton
        disabled={isSubmitting}
        onError={(message) => setApiError(message)}
      />
    </AuthPageShell>
  );
}
