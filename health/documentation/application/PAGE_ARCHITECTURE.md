# Page Architecture & Implementation Guide

## Overview

This document provides a comprehensive guide to the architecture, structure, flow, patterns, and implementation details used across all pages in the application. This architecture follows **Next.js 15 best practices** for Server Components, progressive rendering, performance optimization, authentication, and user experience.

**Use this document as a reference** when creating, updating, or maintaining pages in the application to ensure consistency, best practices, and architectural compliance.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Page Types & Categories](#page-types--categories)
3. [Common Page Structure](#common-page-structure)
4. [File Organization](#file-organization)
5. [Component Hierarchy](#component-hierarchy)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Authentication & Authorization](#authentication--authorization)
8. [Metadata Generation](#metadata-generation)
9. [Revalidation Strategies](#revalidation-strategies)
10. [Progressive Rendering with Suspense](#progressive-rendering-with-suspense)
11. [Error Handling](#error-handling)
12. [Loading States](#loading-states)
13. [Server vs Client Components](#server-vs-client-components)
14. [Implementation Patterns](#implementation-patterns)
15. [Code Examples](#code-examples)
16. [Best Practices Checklist](#best-practices-checklist)
17. [Common Patterns & Solutions](#common-patterns--solutions)

---

## Architecture Overview

### Core Principles

1. **Server-First**: All data fetching happens on the server using Server Components
2. **Progressive Rendering**: Content streams in as it becomes available using React Suspense
3. **Code Splitting**: Automatic code splitting via Suspense boundaries and dynamic imports
4. **Performance**: Optimized images, lazy loading, caching strategies, and minimal JavaScript
5. **User Experience**: Skeleton loading states for immediate visual feedback
6. **Security**: Server-side authentication and authorization checks
7. **Type Safety**: Full TypeScript support with proper interfaces and types
8. **Internationalization**: Built-in support for multiple locales via `next-intl`

### Universal Page Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│              app/[locale]/[page]/page.tsx                   │
│              (Server Component)                             │
│  - Metadata generation                                       │
│  - Revalidation strategy                                     │
│  - Authentication/Authorization checks                      │
│  - Data fetching (if needed)                                 │
│  - Suspense boundaries                                       │
│  - ErrorBoundary wrapping                                    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Server       │   │ Client       │   │ Products     │
│ Section      │   │ Component    │   │ Banner       │
│ Components   │   │ (Interactive)│   │ (Client)     │
│ (Data Fetch) │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## Page Types & Categories

### 1. Public Pages
**Characteristics**:
- No authentication required
- Accessible to all users
- Use `generatePublicMetadata` helper
- Typically cacheable (`revalidate = 3600`)

**Examples**:
- Home page (`/`)
- About page (`/about`)
- Cookie Policy (`/cookie-policy`)
- Privacy Policy (`/privacy-policy`)
- Terms & Conditions (`/terms-conditions`)
- Site Map (`/site-map`)
- Search (`/search`)
- Article pages (`/[category]/[slug]`)

**Pattern**:
```typescript
export const revalidate = 3600; // Cache for 1 hour
// No auth check needed
```

### 2. Guest-Only Pages
**Characteristics**:
- Must NOT be authenticated
- Redirect if already authenticated
- Use `generatePrivateMetadata` helper
- No caching (`revalidate = 0`)

**Examples**:
- Sign In (`/signin`)
- Sign Up (`/signup`)
- Forgot Password (`/forgot-password`)
- Reset Password (`/reset-password`)

**Pattern**:
```typescript
export const revalidate = 0; // No caching

// Server-side auth check - redirect if authenticated
const session = await auth();
if (session?.user?.id) {
  if (session.user.role === "admin") {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/profile`);
  }
}
```

### 3. User-Only Pages
**Characteristics**:
- Require authentication
- Redirect to signin if not authenticated
- Use `generatePrivateMetadata` helper
- Cacheable for authenticated users (`revalidate = 3600` or `0`)

**Examples**:
- Profile (`/profile`)
- Favorites (`/favorites`)

**Pattern**:
```typescript
export const revalidate = 3600; // Cache for 1 hour

// Server-side auth check
const session = await auth();
if (!session?.user?.id) {
  redirect(`/${locale}/signin`);
}
```

### 4. Admin-Only Pages
**Characteristics**:
- Require admin role
- Redirect if not admin
- Use `generatePrivateMetadata` helper
- No caching (`revalidate = 0`)

**Examples**:
- Dashboard (`/dashboard`)
- Create Article (`/create-article`)

**Pattern**:
```typescript
export const revalidate = 0; // No caching

// Server-side auth check
const session = await auth();
if (!session?.user || session.user.role !== "admin") {
  redirect("/");
}
```

### 5. Dynamic Pages with SearchParams
**Characteristics**:
- Use URL search parameters
- Process searchParams on server
- Handle redirects for invalid states
- Typically no caching (`revalidate = 0`)

**Examples**:
- Search (`/search?q=query&page=1`)
- Favorites (`/favorites?page=1`)
- Reset Password (`/reset-password?token=xxx`)
- Unsubscribe (`/unsubscribe?email=xxx&token=xxx`)

**Pattern**:
```typescript
export const revalidate = 0; // Dynamic, no caching

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const { page = "1", q } = await searchParams;
  
  // Process and validate searchParams
  // Handle redirects if needed
}
```

---

## Common Page Structure

### Standard Page Template

Every page follows this consistent structure:

```typescript
import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation"; // If auth/redirects needed
import { generatePublicMetadata } from "@/lib/utils/genericMetadata"; // or generatePrivateMetadata
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth"; // If auth needed
import ErrorBoundary from "@/components/ErrorBoundary";
import ProductsBanner from "@/components/ProductsBanner"; // If needed
import PageContent from "@/components/PageContent"; // Client or Server Component
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

// 1. Metadata Generation
export async function generateMetadata({
  params,
  searchParams, // If needed
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  return generatePublicMetadata(
    locale,
    "/page-path",
    "metadata.page.title"
  );
}

// 2. Revalidation Strategy
export const revalidate = 3600; // or 0 for dynamic pages

// 3. Page Component
export default async function Page({
  params,
  searchParams, // If needed
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 4. Extract params and searchParams
  const { locale } = await params;
  const searchParamsData = searchParams ? await searchParams : {};

  // 5. Authentication/Authorization (if needed)
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/signin`);
  }

  // 6. Data Fetching (if needed)
  const data = await fetchData({ locale });

  // 7. Return JSX with structure
  return (
    <main className="container mx-auto">
      <ErrorBoundary context={"Page name"}>
        {/* Products Banner - Client Component, can be direct */}
        <ProductsBanner size="970x90" affiliateCompany="amazon" />

        <Suspense fallback={<PageSkeleton />}>
          <PageContent locale={locale} data={data} />
        </Suspense>

        {/* Products Banner - Client Component, can be direct */}
        <ProductsBanner size="970x240" affiliateCompany="amazon" />
      </ErrorBoundary>
    </main>
  );
}
```

### Key Structural Elements

1. **Metadata Function**: Always async, awaits params
2. **Revalidate Export**: Defines caching strategy
3. **Main Wrapper**: `<main className="container mx-auto">`
4. **ErrorBoundary**: Wraps entire page content
5. **Suspense Boundaries**: Wrap data-fetching sections
6. **ProductsBanner**: Optional, placed directly (Client Component)

---

## File Organization

### Directory Structure

```
app/
├── [locale]/
│   ├── [page]/
│   │   ├── page.tsx              # Main page component (Server Component)
│   │   └── loading.tsx           # Route-level loading state
│   │
│   ├── [category]/
│   │   ├── [slug]/
│   │   │   ├── page.tsx          # Dynamic route page
│   │   │   └── loading.tsx
│   │   └── page.tsx              # Category listing page
│   │
│   └── layout.tsx                # Locale-specific layout
│
components/
├── server/                       # Server Components (data fetching)
│   ├── PageContentSection.tsx
│   ├── PageHeaderSection.tsx
│   └── ...
│
├── skeletons/                    # Loading skeletons
│   ├── PageSkeleton.tsx
│   └── ...
│
└── [client components]            # Client Components (interactivity)
    ├── PageContent.tsx
    ├── PageForm.tsx
    └── ...
```

### File Naming Conventions

- **Page Components**: `app/[locale]/[page]/page.tsx`
- **Loading Files**: `app/[locale]/[page]/loading.tsx`
- **Server Components**: `components/server/[ComponentName]Section.tsx`
- **Client Components**: `components/[ComponentName].tsx`
- **Skeleton Components**: `components/skeletons/[PageName]Skeleton.tsx`

---

## Component Hierarchy

### 1. Page Component (`app/[locale]/[page]/page.tsx`)

**Type**: Server Component  
**Responsibilities**:
- Generate metadata
- Set revalidation strategy
- Handle authentication/authorization
- Fetch data (if needed)
- Orchestrate Suspense boundaries
- Provide error boundary
- Handle redirects

**Pattern**:
```typescript
export default async function Page({ params }: Props) {
  const { locale } = await params;
  
  // Auth check
  // Data fetching
  // Redirects
  
  return (
    <main>
      <ErrorBoundary>
        <Suspense fallback={<Skeleton />}>
          <Content />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
```

### 2. Server Section Components

**Type**: Server Components  
**Location**: `components/server/`  
**Responsibilities**:
- Fetch data using server actions
- Handle translations
- Pass data to client components
- Render static content

**Pattern**:
```typescript
export default async function SectionComponent({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "page" });
  const data = await fetchDataAction({ locale });
  
  return <ClientComponent data={data} title={t("title")} />;
}
```

### 3. Client Components

**Type**: Client Components  
**Location**: `components/` (root)  
**Responsibilities**:
- Handle user interactions
- Manage client-side state
- Render interactive UI
- Handle form submissions
- Client-side navigation

**Pattern**:
```typescript
"use client";

export default function ClientComponent({ data, title }: Props) {
  const [state, setState] = useState();
  // Interactive logic...
  return <div>{/* UI */}</div>;
}
```

### 4. Skeleton Components

**Type**: Server Components (can be client too)  
**Location**: `components/skeletons/`  
**Responsibilities**:
- Provide loading state UI
- Match final component dimensions
- Use `animate-pulse` for subtle animation

**Pattern**:
```typescript
export function PageSkeleton() {
  return (
    <div>
      <Skeleton className="h-12 w-64" />
      {/* Match actual component layout */}
    </div>
  );
}
```

---

## Data Flow Patterns

### Pattern 1: Server-Side Data Fetching

```
┌─────────────────┐
│ Server Component│
│ (page.tsx)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Server Section  │
│ Component       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ Server Action   │─────▶│ Service      │
│ (app/actions)   │      │ Layer        │
└─────────────────┘      │ (lib/services)│
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ Database      │
                         │ (MongoDB)     │
                         └──────────────┘
```

### Pattern 2: Client-Side Interactions

```
┌─────────────────┐
│ Client Component│
│ (User clicks)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Server Action   │
│ (app/actions)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service Layer   │
│ (lib/services)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Database        │
└─────────────────┘
```

### Pattern 3: Progressive Rendering Flow

```
1. User requests page
   ↓
2. Server starts rendering
   ↓
3. Route-level loading.tsx shows (Skeleton)
   ↓
4. Page component streams in (when ready)
   ↓
5. Suspense boundaries resolve one by one
   ↓
6. Content appears progressively
```

---

## Authentication & Authorization

### Authentication Patterns

#### 1. Guest-Only Pages
```typescript
// Redirect if authenticated
const session = await auth();
if (session?.user?.id) {
  if (session.user.role === "admin") {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/profile`);
  }
}
```

#### 2. User-Only Pages
```typescript
// Redirect if not authenticated
const session = await auth();
if (!session?.user?.id) {
  redirect(`/${locale}/signin`);
}
```

#### 3. Admin-Only Pages
```typescript
// Redirect if not admin
const session = await auth();
if (!session?.user || session.user.role !== "admin") {
  redirect("/");
}
```

### Authorization Levels

- **Public**: No authentication required
- **Guest**: Must NOT be authenticated
- **User**: Must be authenticated (any role)
- **Admin**: Must be authenticated with admin role

---

## Metadata Generation

### Public Pages

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePublicMetadata(
    locale,
    "/page-path",
    "metadata.page.title"
  );
}
```

### Private Pages

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePrivateMetadata(
    locale,
    "/page-path",
    "metadata.page.title"
  );
}
```

### Dynamic Metadata (with searchParams)

```typescript
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = q as string;

  const metadata = await generatePublicMetadata(
    locale,
    "/search",
    "metadata.search.title"
  );

  // Enhance with dynamic data
  if (query) {
    return {
      ...metadata,
      title: `Search results for "${query}" | ${metadata.title}`,
      description: `Find articles related to "${query}"`,
    };
  }

  return metadata;
}
```

---

## Revalidation Strategies

### Caching Strategies by Page Type

| Page Type | Revalidate Value | Reason |
|-----------|-----------------|--------|
| Public Static | `3600` (1 hour) | Content changes infrequently |
| Public Dynamic | `3600` (1 hour) | Cache for performance, revalidate periodically |
| User Pages | `3600` (1 hour) | User-specific but cacheable |
| Admin Pages | `0` (no cache) | Always show latest data |
| Auth Pages | `0` (no cache) | Security-sensitive, no caching |
| Dynamic with searchParams | `0` (no cache) | URL parameters make each request unique |

### Examples

```typescript
// Public static page
export const revalidate = 3600; // 1 hour

// Admin page
export const revalidate = 0; // No caching

// User page
export const revalidate = 3600; // 1 hour

// Dynamic page with searchParams
export const revalidate = 0; // No caching
```

---

## Progressive Rendering with Suspense

### Why Suspense?

Suspense enables **streaming HTML** - content appears as soon as it's ready, rather than waiting for everything to load.

### Implementation Pattern

```typescript
<Suspense fallback={<SectionSkeleton />}>
  <SectionComponent locale={locale} />
</Suspense>
```

### Benefits

1. **Faster Time to First Byte (TTFB)**: Page shell loads immediately
2. **Better Perceived Performance**: Users see content progressively
3. **Improved Core Web Vitals**: Better LCP (Largest Contentful Paint)
4. **Automatic Code Splitting**: Each Suspense boundary creates a code split point

### Suspense Boundary Strategy

**Above the Fold** (Critical):
- Hero sections
- Featured content
- Show immediately with route-level `loading.tsx`

**Below the Fold** (Non-Critical):
- Newsletter sections
- Category carousels
- Can stream in progressively

---

## Error Handling

### ErrorBoundary Pattern

Every page wraps content in an ErrorBoundary:

```typescript
<ErrorBoundary context={"Page name"}>
  {/* Page content */}
</ErrorBoundary>
```

### Error Handling in Server Components

```typescript
try {
  const data = await fetchData();
} catch (error) {
  console.error("Error fetching data:", error);
  // Handle error gracefully
  // Return error state or redirect
}
```

### Error States

- **Server Errors**: Caught in try-catch, logged, handled gracefully
- **Client Errors**: Caught by ErrorBoundary, displayed to user
- **Auth Errors**: Redirect to appropriate page
- **Data Errors**: Show empty state or error message

---

## Loading States

### Route-Level Loading (`app/[locale]/[page]/loading.tsx`)

```typescript
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <main className="container mx-auto">
      <PageSkeleton />
    </main>
  );
}
```

### Skeleton Component Pattern

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton - match actual component */}
      <div className="text-center mb-10">
        <Skeleton className="h-9 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto max-w-2xl" />
      </div>

      {/* Content skeleton - match actual layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Server vs Client Components

### When to Use Server Components

✅ **Use Server Components for**:
- Data fetching
- Accessing backend resources (databases, APIs)
- Keeping sensitive information on server (API keys, tokens)
- Large dependencies that should not be in client bundle
- Static content that doesn't need interactivity
- Metadata generation
- Authentication checks

**Example**:
```typescript
// components/server/PageSection.tsx
export default async function PageSection({ locale }: Props) {
  const data = await getData({ locale });
  return <ClientComponent data={data} />;
}
```

### When to Use Client Components

✅ **Use Client Components for**:
- Interactivity (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- React hooks (useState, useEffect, etc.)
- Event listeners
- Third-party libraries that require client-side JavaScript
- Forms with client-side validation
- Real-time updates

**Example**:
```typescript
// components/PageForm.tsx
"use client";

export default function PageForm({ locale }: Props) {
  const [state, setState] = useState();
  // Interactive logic...
  return <form>{/* UI */}</form>;
}
```

### Component Composition Pattern

**Server Component** → **Client Component** ✅ (Recommended)
```typescript
// Server Component
export default async function Section() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}
```

**Client Component** → **Server Component** ❌ (Not Allowed)
```typescript
// ❌ This won't work
"use client";
export default function Component() {
  return <ServerComponent />; // Error!
}
```

---

## Implementation Patterns

### Pattern 1: Simple Static Page

```typescript
// app/[locale]/about/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import ErrorBoundary from "@/components/ErrorBoundary";
import AboutContentSection from "@/components/server/AboutContentSection";
import { AboutSkeleton } from "@/components/skeletons/AboutSkeleton";
import ProductsBanner from "@/components/ProductsBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/about", "metadata.about.title");
}

export const revalidate = 3600; // 1 hour

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="container mx-auto">
      <ErrorBoundary context={"About page"}>
        <ProductsBanner size="970x90" affiliateCompany="amazon" />
        <Suspense fallback={<AboutSkeleton />}>
          <AboutContentSection locale={locale} />
        </Suspense>
        <ProductsBanner size="970x240" affiliateCompany="amazon" />
      </ErrorBoundary>
    </main>
  );
}
```

### Pattern 2: User-Only Page with Data Fetching

```typescript
// app/[locale]/favorites/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Favorites from "@/components/Favorites";
import { FavoritesSkeleton } from "@/components/skeletons/FavoritesSkeleton";
import { getUserLikedArticles } from "@/app/actions/user/getUserLikedArticles";
import ProductsBanner from "@/components/ProductsBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/favorites", "metadata.favorites.title");
}

export const revalidate = 3600; // 1 hour

export default async function FavoritesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const { page = "1" } = await searchParams;

  // Server-side auth check
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/signin`);
  }

  const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
  const ARTICLES_PER_PAGE = 10;

  // Fetch data
  const result = await getUserLikedArticles(
    session.user.id,
    currentPage,
    ARTICLES_PER_PAGE,
    locale
  );

  const favoriteArticles = result.data || [];
  const paginationData = {
    currentPage: result.currentPage || currentPage,
    totalPages: result.totalPages || 1,
    totalArticles: result.totalDocs || 0,
  };

  // Handle invalid page numbers
  if (currentPage > paginationData.totalPages && paginationData.totalPages > 0) {
    redirect(`/${locale}/favorites?page=1`);
  }

  return (
    <main className="container mx-auto">
      <ErrorBoundary context={"Favorites page"}>
        <ProductsBanner size="970x90" affiliateCompany="amazon" />
        <Suspense fallback={<FavoritesSkeleton />}>
          <Favorites
            locale={locale}
            favoriteArticles={favoriteArticles}
            paginationData={paginationData}
          />
        </Suspense>
        <ProductsBanner size="970x240" affiliateCompany="amazon" />
      </ErrorBoundary>
    </main>
  );
}
```

### Pattern 3: Admin-Only Page

```typescript
// app/[locale]/dashboard/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "@/components/Dashboard";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { getAllArticlesForDashboard } from "@/app/actions/article/getAllArticlesForDashboard";
import { getWeeklyStats } from "@/app/actions/article/getWeeklyStats";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/dashboard", "metadata.dashboard.title");
}

export const revalidate = 0; // Admin page, no caching

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

  // Fetch data on the server
  const [articles, weeklyStats] = await Promise.all([
    getAllArticlesForDashboard(),
    getWeeklyStats(),
  ]);

  return (
    <main className="container mx-auto">
      <ErrorBoundary context={"Dashboard page"}>
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard
            articles={articles}
            weeklyStats={weeklyStats}
            locale={locale}
          />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
```

### Pattern 4: Guest-Only Page

```typescript
// app/[locale]/signin/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import SignIn from "@/components/SignIn";
import { SignInSkeleton } from "@/components/skeletons/SignInSkeleton";
import ProductsBanner from "@/components/ProductsBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/signin", "metadata.signin.title");
}

export const revalidate = 0; // Auth page, no caching

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Server-side auth check - redirect if already authenticated
  const session = await auth();
  if (session?.user?.id) {
    if (session.user.role === "admin") {
      redirect(`/${locale}/dashboard`);
    } else {
      redirect(`/${locale}/profile`);
    }
  }

  return (
    <main className="container mx-auto">
      <ErrorBoundary context={"Signin page"}>
        <ProductsBanner size="970x90" affiliateCompany="amazon" />
        <Suspense fallback={<SignInSkeleton />}>
          <SignIn locale={locale} />
        </Suspense>
        <ProductsBanner size="970x240" affiliateCompany="amazon" />
      </ErrorBoundary>
    </main>
  );
}
```

### Pattern 5: Dynamic Page with SearchParams

```typescript
// app/[locale]/search/page.tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import ErrorBoundary from "@/components/ErrorBoundary";
import Search from "@/components/Search";
import { SearchSkeleton } from "@/components/skeletons/SearchSkeleton";
import { searchArticlesPaginated } from "@/app/actions/article/searchArticlesPaginated";
import ProductsBanner from "@/components/ProductsBanner";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = q as string;

  const metadata = await generatePublicMetadata(
    locale,
    "/search",
    "metadata.search.title"
  );

  if (query) {
    return {
      ...metadata,
      title: `Search results for "${query}" | ${metadata.title}`,
      description: `Find articles related to "${query}"`,
    };
  }

  return metadata;
}

export const revalidate = 3600; // Public page, cache for 1 hour

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const { page = "1", q } = await searchParams;
  const query = q as string;

  // Redirect to home if no search query
  if (!query || query.trim() === "") {
    redirect(`/${locale}`);
  }

  const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
  const ARTICLES_PER_PAGE = 10;

  // Fetch search results
  const searchResult = await searchArticlesPaginated({
    query: query.trim(),
    locale,
    page: currentPage,
    sort: "createdAt",
    order: "desc",
    limit: ARTICLES_PER_PAGE,
  });

  const searchResults = searchResult.data || [];
  const paginationData = {
    currentPage,
    totalPages: searchResult.totalPages,
    totalArticles: searchResult.totalDocs,
  };

  // Redirect to page 1 if current page is greater than total pages
  if (currentPage > paginationData.totalPages && paginationData.totalPages > 0) {
    redirect(`/${locale}/search?q=${encodeURIComponent(query)}&page=1`);
  }

  return (
    <main className="container mx-auto">
      <ErrorBoundary context={"Search page"}>
        <ProductsBanner size="970x90" affiliateCompany="amazon" />
        <Suspense fallback={<SearchSkeleton />}>
          <Search
            locale={locale}
            searchResults={searchResults}
            query={query}
            paginationData={paginationData}
          />
        </Suspense>
        <ProductsBanner size="970x240" affiliateCompany="amazon" />
      </ErrorBoundary>
    </main>
  );
}
```

---

## Code Examples

### Complete Example: User Profile Page

**1. Page Component** (`app/[locale]/profile/page.tsx`):
```typescript
import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Profile from "@/components/Profile";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { getUserById } from "@/app/actions/user/getUserById";
import ProductsBanner from "@/components/ProductsBanner";

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
  if (!session?.user?.id) {
    redirect(`/${locale}/signin`);
  }

  // Fetch user data on server
  const userResult = await getUserById(session.user.id);
  if (!userResult.success || !userResult.data) {
    redirect(`/${locale}/signin`);
  }

  const userData = Array.isArray(userResult.data)
    ? userResult.data[0]
    : userResult.data;

  return (
    <main className="container mx-auto">
      <ErrorBoundary context={"Profile page"}>
        <ProductsBanner size="970x90" affiliateCompany="amazon" />
        <Suspense fallback={<ProfileSkeleton />}>
          <Profile locale={locale} initialUser={userData} />
        </Suspense>
        <ProductsBanner size="970x240" affiliateCompany="amazon" />
      </ErrorBoundary>
    </main>
  );
}
```

**2. Loading State** (`app/[locale]/profile/loading.tsx`):
```typescript
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";

export default function Loading() {
  return (
    <main className="container mx-auto">
      <ProfileSkeleton />
    </main>
  );
}
```

---

## Best Practices Checklist

### ✅ Page Component Checklist

- [ ] Use `async` function for Server Component
- [ ] Implement `generateMetadata` for SEO
- [ ] Set `revalidate` for caching strategy
- [ ] Extract `locale` from `params` using `await params`
- [ ] Extract `searchParams` using `await searchParams` (if needed)
- [ ] Implement authentication/authorization checks (if needed)
- [ ] Handle redirects appropriately
- [ ] Wrap content in `ErrorBoundary`
- [ ] Use `Suspense` boundaries for each data-fetching section
- [ ] Provide appropriate skeleton fallbacks
- [ ] Wrap content in `<main className="container mx-auto">`
- [ ] Place ProductsBanner components directly (Client Component)

### ✅ Server Section Component Checklist

- [ ] Located in `components/server/` directory
- [ ] Use `async` function
- [ ] Fetch data using server actions
- [ ] Handle translations with `getTranslations`
- [ ] Pass data to client components
- [ ] Handle empty states gracefully
- [ ] Use proper TypeScript types

### ✅ Client Component Checklist

- [ ] Add `"use client"` directive at top
- [ ] Located in `components/` directory (root)
- [ ] Only handle interactivity and client-side logic
- [ ] Receive data as props from server components
- [ ] Use proper TypeScript types
- [ ] Optimize re-renders with proper state management

### ✅ Skeleton Component Checklist

- [ ] Match actual component dimensions
- [ ] Match actual component layout structure
- [ ] Use `Skeleton` component with `animate-pulse`
- [ ] Located in `components/skeletons/` directory
- [ ] Export as named export

### ✅ Authentication Checklist

- [ ] Implement server-side auth checks
- [ ] Handle redirects appropriately
- [ ] Use correct metadata helper (public/private)
- [ ] Set appropriate revalidation strategy
- [ ] Handle role-based access control (if needed)

### ✅ Performance Checklist

- [ ] Implement Suspense boundaries for progressive rendering
- [ ] Create route-level `loading.tsx` for initial load
- [ ] Use dynamic imports for below-fold components
- [ ] Set appropriate `revalidate` values
- [ ] Optimize images with proper quality settings
- [ ] Implement error boundaries

### ✅ Code Quality Checklist

- [ ] Follow consistent file naming conventions
- [ ] Use TypeScript for type safety
- [ ] Keep components focused and single-purpose
- [ ] Extract reusable logic into utilities
- [ ] Document complex logic with comments
- [ ] Remove unused code and imports
- [ ] Ensure all imports are present

---

## Common Patterns & Solutions

### Pattern: Multiple Data-Fetching Sections

```typescript
<Suspense fallback={<Section1Skeleton />}>
  <Section1Component locale={locale} />
</Suspense>

<Suspense fallback={<Section2Skeleton />}>
  <Section2Component locale={locale} />
</Suspense>
```

### Pattern: Conditional Rendering in Server Components

```typescript
export default async function Page({ params }: Props) {
  const data = await fetchData();
  
  if (!data.length) {
    return <EmptyState />;
  }
  
  return <DataComponent data={data} />;
}
```

### Pattern: Error Handling

```typescript
// Page level
<ErrorBoundary context={"Page name"}>
  <Suspense fallback={<Skeleton />}>
    <SectionComponent />
  </Suspense>
</ErrorBoundary>
```

### Pattern: Translations

```typescript
// Server Component
const t = await getTranslations({ locale, namespace: "page" });
return <Component title={t("title")} />;

// Client Component
const t = useTranslations("page");
return <h1>{t("title")}</h1>;
```

### Pattern: Pagination with Redirects

```typescript
const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
const result = await fetchPaginatedData({ page: currentPage });

// Redirect to page 1 if current page is greater than total pages
if (currentPage > result.totalPages && result.totalPages > 0) {
  redirect(`/${locale}/page?page=1`);
}
```

### Pattern: Parallel Data Fetching

```typescript
const [data1, data2, data3] = await Promise.all([
  fetchData1(),
  fetchData2(),
  fetchData3(),
]);
```

---

## Summary

This architecture provides:

✅ **Consistent Structure**: All pages follow the same patterns  
✅ **Fast Initial Load**: Route-level loading states  
✅ **Progressive Rendering**: Content streams as ready  
✅ **Optimal Performance**: Image optimization, code splitting, caching  
✅ **Great UX**: Skeleton loading states, error boundaries  
✅ **Maintainable Code**: Clear separation of concerns  
✅ **Scalable**: Easy to add new pages  
✅ **Secure**: Server-side authentication and authorization  
✅ **Type-Safe**: Full TypeScript support  
✅ **Next.js 15 Best Practices**: Server Components, Suspense, streaming  

**Use this document as your reference** when building or updating pages to ensure consistency and best practices across the entire application.

---

## Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Suspense and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Performance Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing)
- `HOME_PAGE_ARCHITECTURE.md` - Home page specific architecture
- `ARTICLES_FLOW_DOCUMENTATION.md` - Article system documentation
- `SERVER_ACTIONS_ARCHITECTURE.md` - Server actions documentation

---

**Last Updated**: Based on Next.js 15.5.6 and current application implementation  
**Status**: ✅ All pages follow this architecture pattern

