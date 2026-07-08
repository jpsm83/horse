"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Link } from "@/i18n/navigation.ts";
import { requestEmailConfirmation } from "@/lib/api/auth/credentials";
import { isApiClientError } from "@/lib/api/auth/session";
import { cn } from "@/lib/utils";
import {
  authFormMessagesFromTranslations,
  createAuthFormSchemas,
  type ResendConfirmationFormValues,
} from "@/lib/validations/authForms.ts";

export default function ResendConfirmationPage() {
  const t = useTranslations("auth.resendConfirmation");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tValidation = useTranslations("validation");
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  const { resendConfirmationFormSchema } = useMemo(
    () =>
      createAuthFormSchemas(authFormMessagesFromTranslations((key) => tValidation(key))),
    [tValidation],
  );

  const form = useForm<ResendConfirmationFormValues>({
    resolver: zodResolver(resendConfirmationFormSchema),
    defaultValues: { email: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: ResendConfirmationFormValues) {
    setApiError(null);
    setAlreadyVerified(false);

    try {
      await requestEmailConfirmation(data.email);
      setSubmitted(true);
    } catch (err) {
      if (isApiClientError(err) && err.statusCode === 400) {
        setAlreadyVerified(true);
        return;
      }
      setApiError(err instanceof Error ? err.message : tStatus("requestFailed"));
    }
  }

  if (submitted) {
    return (
      <AuthPageShell
        title={t("title")}
        description={t("success")}
        footer={
          <Link href="/signin" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t("backToSignIn")}
          </Link>
        }
      >
        <Alert>
          <AlertDescription>{t("success")}</AlertDescription>
        </Alert>
      </AuthPageShell>
    );
  }

  if (alreadyVerified) {
    return (
      <AuthPageShell
        title={t("title")}
        description={t("alreadyVerified")}
        footer={
          <Link href="/signin" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t("backToSignIn")}
          </Link>
        }
      >
        <Link href="/signin" className={cn(buttonVariants(), "w-full")}>
          {tCommon("signIn")}
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <Link href="/signin" className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("backToSignIn")}
        </Link>
      }
    >
      {apiError ? (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <TextField
            control={form.control}
            name="email"
            id="resend-email"
            label={tCommon("email")}
            type="email"
            autoComplete="email"
          />
        </FieldGroup>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? tCommon("loading") : t("submit")}
        </Button>
      </form>
    </AuthPageShell>
  );
}
