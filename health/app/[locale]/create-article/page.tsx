import { Metadata } from "next";
import { redirect } from "next/navigation";
import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import CreateArticleForm from "@/components/CreateArticleForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePrivateMetadata(
    locale,
    "/create-article",
    "metadata.createArticle.title"
  );
}

export const revalidate = 0; // Admin page, no caching needed

export default async function CreateArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Server-side auth check
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"Create Article page"}>
        <div className="flex flex-col h-full gap-8 md:gap-16">
          {/* Form Section */}
          <CreateArticleForm locale={locale} />
        </div>
      </ErrorBoundary>
    </main>
  );
}
