"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Link } from "@/i18n/navigation.ts";
import { requestPasswordReset } from "@/lib/api/auth/credentials";
import {
  authFormMessagesFromTranslations,
  createAuthFormSchemas,
  type ForgotPasswordFormValues,
} from "@/lib/validations/authForms.ts";

import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/forgot-password", "metadata.forgotPassword");
}

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tValidation = useTranslations("validation");
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { forgotPasswordFormSchema } = useMemo(
    () =>
      createAuthFormSchemas(authFormMessagesFromTranslations((key) => tValidation(key))),
    [tValidation],
  );

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: ForgotPasswordFormValues) {
    setApiError(null);

    try {
      await requestPasswordReset(data.email);
      setSubmitted(true);
    } catch (err) {
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
            id="forgot-email"
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
