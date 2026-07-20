"use client";

import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { USER_HOME_PATH } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

function HomeWelcomeHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-8 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-primary/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 size-40 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative space-y-1">
        <p className="text-xs font-medium tracking-widest text-primary uppercase">Equus</p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function HomeGuestPanel({
  title,
  description,
  signInLabel,
  signUpLabel,
}: {
  title: string;
  description: string;
  signInLabel: string;
  signUpLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-linear-to-r from-primary/10 via-card to-accent/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <UserRound className="size-5" aria-hidden />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row">
        <Link href="/signin" className={cn(buttonVariants({ size: "lg" }), "w-full sm:flex-1")}>
          {signInLabel}
        </Link>
        <Link
          href="/signup"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:flex-1")}
        >
          {signUpLabel}
        </Link>
      </div>
    </div>
  );
}

/** Guest landing only — signed-in users are sent to `/home`. */
export function HomePage() {
  const router = useRouter();
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading } = useAppAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(USER_HOME_PATH);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <Skeleton className="h-[calc(100vh-5rem)] w-full rounded-none" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:py-12">
      <HomeWelcomeHero title={t("guestTitle")} subtitle={t("guestDescription")} />

      <HomeGuestPanel
        title={t("getStartedTitle")}
        description={t("getStartedDescription")}
        signInLabel={tCommon("signIn")}
        signUpLabel={tCommon("signUp")}
      />
    </div>
  );
}
