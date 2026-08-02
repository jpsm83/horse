import type { Metadata } from "next";

import { ResetPasswordClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/reset-password", "metadata.resetPassword");
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
