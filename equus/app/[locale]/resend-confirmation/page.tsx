import { ResendConfirmationContent } from "@/components/auth/resend-confirmation-content.tsx";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/resend-confirmation", "metadata.resendConfirmation");
}

export default function ResendConfirmationPage() {
  return <ResendConfirmationContent />;
}
