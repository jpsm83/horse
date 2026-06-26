"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { resetPassword } from "@/lib/api/authClient.ts";
import { cn } from "@/lib/utils";
import {
  authFormMessagesFromTranslations,
  createAuthFormSchemas,
  type ResetPasswordFormValues,
} from "@/lib/validations/authForms.ts";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.resetPassword");
  const tForgot = useTranslations("auth.forgotPassword");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const tStatus = useTranslations("status");
  const tValidation = useTranslations("validation");
  const token = searchParams.get("token");
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { resetPasswordFormSchema } = useMemo(
    () =>
      createAuthFormSchemas(authFormMessagesFromTranslations((key) => tValidation(key))),
    [tValidation],
  );

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) return;
    setApiError(null);

    try {
      await resetPassword(token, data.newPassword);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : tStatus("requestFailed"));
    }
  }

  if (!token) {
    return (
      <AuthPageShell
        title={t("title")}
        description={t("missingToken")}
        footer={
          <Link href="/forgot-password" className="font-medium text-foreground underline-offset-4 hover:underline">
            {tForgot("title")}
          </Link>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{t("missingToken")}</AlertDescription>
        </Alert>
      </AuthPageShell>
    );
  }

  if (success) {
    return (
      <AuthPageShell
        title={t("title")}
        description={t("success")}
        footer={
          <Link href="/signin" className="font-medium text-foreground underline-offset-4 hover:underline">
            {tCommon("signIn")}
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
          {tForgot("backToSignIn")}
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
            name="newPassword"
            id="reset-newPassword"
            label={t("newPassword")}
            type="password"
            autoComplete="new-password"
            description={tAuth("passwordPolicy")}
          />
          <TextField
            control={form.control}
            name="confirmPassword"
            id="reset-confirmPassword"
            label={t("confirmPassword")}
            type="password"
            autoComplete="new-password"
          />
        </FieldGroup>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? tCommon("loading") : t("submit")}
        </Button>
      </form>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const tCommon = useTranslations("common");

  return (
    <Suspense
      fallback={
        <AuthPageShell
          title={t("title")}
          description={tCommon("loading")}
          footer={<span>{tCommon("loading")}</span>}
        >
          <Alert>
            <AlertDescription>{tCommon("loading")}</AlertDescription>
          </Alert>
        </AuthPageShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
