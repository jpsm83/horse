import { ForgotPasswordContent } from "@/components/auth/forgot-password-content.tsx";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/forgot-password", "metadata.forgotPassword");
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
