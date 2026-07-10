import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell.tsx";
import { AppProviders } from "@/components/providers/app-providers.tsx";
import { SetHtmlLang } from "@/components/set-html-lang.tsx";
import { routing } from "@/i18n/routing.ts";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "", "metadata.home");
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SetHtmlLang locale={locale} />
      <AppProviders>
        <AppShell>{children}</AppShell>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
