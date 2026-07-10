"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 250;
const INITIAL_DELAY_MS = 500;

const AdSenseRouter = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const clearPending = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const hasUninitializedSlots = () => {
      const adNodes = document.querySelectorAll("ins.adsbygoogle");
      return Array.from(adNodes).some(
        (node) => !node.getAttribute("data-adsbygoogle-status")
      );
    };

    const tryPush = (attempt: number) => {
      const adsQueue = window.adsbygoogle;

      if (!adsQueue || !Array.isArray(adsQueue)) {
        if (attempt < MAX_RETRIES) {
          timeoutRef.current = setTimeout(
            () => tryPush(attempt + 1),
            RETRY_DELAY_MS
          );
        }
        return;
      }

      if (document.readyState !== "complete") {
        if (attempt < MAX_RETRIES) {
          timeoutRef.current = setTimeout(
            () => tryPush(attempt + 1),
            RETRY_DELAY_MS
          );
        }
        return;
      }

      if (!hasUninitializedSlots()) return;

      try {
        adsQueue.push({});
      } catch {
        // Ignore third-party script timing errors.
      }
    };

    clearPending();

    // Wait for route content to render before AdSense scans the page.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        timeoutRef.current = setTimeout(() => tryPush(0), INITIAL_DELAY_MS);
      });
    });

    return clearPending;
  }, [pathname, searchParams]);

  return null;
};

export default AdSenseRouter;
