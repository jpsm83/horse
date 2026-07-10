"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface PaginationPrefetcherProps {
  previousUrl?: string;
  nextUrl?: string;
}

export default function PaginationPrefetcher({
  previousUrl,
  nextUrl,
}: PaginationPrefetcherProps) {
  const router = useRouter();

  useEffect(() => {
    // Prefetch previous page if it exists
    if (previousUrl) {
      router.prefetch(previousUrl);
    }

    // Prefetch next page if it exists
    if (nextUrl) {
      router.prefetch(nextUrl);
    }
  }, [router, previousUrl, nextUrl]);

  return null; // This component doesn't render anything
}

