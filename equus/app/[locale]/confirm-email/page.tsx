import type { Metadata } from "next";

import { ConfirmEmailClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/confirm-email", "metadata.confirmEmail");
}

export default function ConfirmEmailPage() {
  return <ConfirmEmailClient />;
}
