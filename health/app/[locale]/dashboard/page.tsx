import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "@/components/Dashboard";
import { getAllArticlesForDashboard } from "@/app/actions/article/getAllArticlesForDashboard";
import { getWeeklyStats } from "@/app/actions/article/getWeeklyStats";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePrivateMetadata(
    locale,
    "/dashboard",
    "metadata.dashboard.title"
  );
}

export const revalidate = 0; // Admin page, no caching needed

export default async function DashboardPage({
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
      <ErrorBoundary context={"Dashboard page"}>
        <div className="flex flex-col h-full gap-8 md:gap-16">
          {/* Dashboard Section */}
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent locale={locale} />
          </Suspense>
        </div>
      </ErrorBoundary>
    </main>
  );
}

// Dashboard Content Component
async function DashboardContent({ locale }: { locale: string }) {
  // Fetch data on the server
  const [articles, weeklyStats] = await Promise.all([
    getAllArticlesForDashboard(),
    getWeeklyStats(),
  ]);

  return (
    <Dashboard
      articles={articles}
      weeklyStats={weeklyStats}
      locale={locale}
    />
  );
}
