"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
  uniqueId?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AdBanner = ({
  dataAdSlot,
  dataAdFormat = "auto",
  dataFullWidthResponsive = true,
  uniqueId,
  className,
}: AdBannerProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const elementId = useMemo(
    () => uniqueId || `adbanner-${Math.random().toString(36).substr(2, 9)}`,
    [uniqueId]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const getAdElement = () => {
      return document.getElementById(elementId) as HTMLElement | null;
    };

    const hasAdsInitialized = () => {
      const element = getAdElement();
      return element?.getAttribute("data-adsbygoogle-status") !== null;
    };

    const initializeAd = () => {
      if (hasAdsInitialized()) return;

      const element = getAdElement();
      if (!element) return;

      if (window.adsbygoogle && document.readyState === "complete") {
        try {
          window.adsbygoogle.push({});
        } catch {
          // AdSense handles errors
        }
      }
    };

    const tryInitialize = () => {
      if (document.readyState === "complete") {
        timeoutRef.current = setTimeout(initializeAd, 300);
      } else {
        timeoutRef.current = setTimeout(tryInitialize, 100);
      }
    };

    timeoutRef.current = setTimeout(tryInitialize, 200);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dataAdSlot, elementId, isMounted]);

  // Render placeholder with exact same dimensions during SSR
  if (!isMounted) {
    return (
      <div className={`flex justify-center ${className || ""}`}>
        <div 
          style={{ 
            minWidth: "320px", 
            minHeight: "100px",
            display: "block"
          }} 
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className || ""}`}>
      <ins
        id={elementId}
        className="adsbygoogle"
        style={{ display: "block", minWidth: "320px", minHeight: "100px" }}
        data-ad-client="ca-pub-4895395148287261"
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive}
      />
    </div>
  );
};

export default AdBanner;