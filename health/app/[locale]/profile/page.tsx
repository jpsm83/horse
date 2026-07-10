import { Metadata } from "next";
import { Suspense } from "react";
import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import Profile from "@/components/Profile";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getUserById } from "@/app/actions/user/getUserById";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { redirect } from "next/navigation";
import ProductsBanner from "@/components/ProductsBanner";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import AdBanner from "@/components/adSence/AdBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePrivateMetadata(locale, "/profile", "metadata.profile.title");
}

export const revalidate = 0; // User page, no caching needed

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Server-side auth check
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect(`/${locale}/signin`);
  }

  return (
    <main>
      <ErrorBoundary context={"Profile page"}>
        <div className="container mx-auto my-8 md:my-16">
          <div className="flex flex-col h-full gap-8 md:gap-16">
            {/* Products Banner */}
            <ProductsBanner size="970x90" affiliateCompany="amazon" />

            {/* AdBanner */}
            <AdBanner
              dataAdSlot="4003409246"
              uniqueId="adbanner-profile-1"
              className="hidden lg:block"
            />

            {/* Profile Form Section */}
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileContent locale={locale} userId={session.user.id} />
            </Suspense>

            {/* Products Banner */}
            <ProductsBanner size="970x240" affiliateCompany="amazon" />

            {/* AdBanner */}
            <div className="flex justify-center gap-6">
              <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-profile-2" />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-profile-3"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-profile-4"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-profile-5"
                className="hidden lg:block"
              />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}

// Profile Content Component
async function ProfileContent({
  locale,
  userId,
}: {
  locale: string;
  userId: string;
}) {
  // Fetch user data on server
  const userResult = await getUserById(userId);

  if (!userResult.success || !userResult.data) {
    redirect(`/${locale}/signin`);
  }

  // Handle array response from getUserById
  const userData = Array.isArray(userResult.data)
    ? userResult.data[0]
    : userResult.data;

  return <Profile locale={locale} initialUser={userData} />;
}
