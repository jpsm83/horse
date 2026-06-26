"use client";

import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { Link } from "@/i18n/navigation.ts";
import { formatAuthProvider } from "@/lib/api/authClient.ts";
import { cn } from "@/lib/utils";

export function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const { user, isAuthenticated, isLoading } = useAppAuth();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("welcomeTitle")}</h1>
        <p className="text-muted-foreground">{t("welcomeDescription")}</p>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("loadingSession")}</CardTitle>
          </CardHeader>
        </Card>
      ) : isAuthenticated && user ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("signedInTitle")}</CardTitle>
            <CardDescription>{t("signedInDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">{t("emailLabel")}</span> {user.email}
            </p>
            <p>
              <span className="font-medium">{t("userIdLabel")}</span> {user.id}
            </p>
            <p>
              <span className="font-medium">{t("providerLabel")}</span>{" "}
              {formatAuthProvider(user.authProvider)}
            </p>
            <p>
              <span className="font-medium">{t("emailVerifiedLabel")}</span>{" "}
              {user.emailVerified ? t("yes") : t("no")}
            </p>
            <p>
              <span className="font-medium">{t("profileCompleteLabel")}</span>{" "}
              {user.profileComplete ? t("yes") : t("no")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("getStartedTitle")}</CardTitle>
            <CardDescription>{t("getStartedDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/signin" className={cn(buttonVariants())}>
              {tCommon("signIn")}
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ variant: "outline" }))}>
              {tCommon("signUp")}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
