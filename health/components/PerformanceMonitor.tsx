"use client";

import { useEffect } from "react";
import { onCLS, onLCP, onTTFB, onINP, Metric } from "web-vitals";

// Type for Google Analytics gtag function
interface GtagFunction {
  (command: string, targetId: string, config?: Record<string, unknown>): void;
  (command: "event", eventName: string, params?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    gtag?: GtagFunction;
    dataLayer?: unknown[];
  }
}

// Helper function to send metrics to Google Analytics
function sendToGoogleAnalytics(metric: Metric) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

// Helper function to log metrics in development
function logMetric(metric: Metric) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    });
  }
}

export default function PerformanceMonitor() {
  useEffect(() => {
    // Track Core Web Vitals
    onCLS((metric) => {
      sendToGoogleAnalytics(metric);
      logMetric(metric);
    });

    onLCP((metric) => {
      sendToGoogleAnalytics(metric);
      logMetric(metric);
    });

    onTTFB((metric) => {
      sendToGoogleAnalytics(metric);
      logMetric(metric);
    });

    // Track INP (Interaction to Next Paint) - newer metric
    onINP((metric) => {
      sendToGoogleAnalytics(metric);
      logMetric(metric);
    });

    // Track page load time
    if (typeof window !== "undefined" && window.performance) {
      window.addEventListener("load", () => {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        if (navigation) {
          const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          
          if (window.gtag) {
            window.gtag("event", "page_load", {
              event_category: "Performance",
              event_label: "home_page",
              value: Math.round(pageLoadTime),
              non_interaction: true,
            });
          }

          if (process.env.NODE_ENV === "development") {
            console.log(`[Performance] Page loaded in ${pageLoadTime.toFixed(2)}ms`);
          }
        }
      });
    }

    // Track skeleton loading duration (time until first content appears)
    if (typeof window !== "undefined") {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "paint" && entry.name === "first-contentful-paint") {
            const fcp = entry.startTime;
            
            if (window.gtag) {
              window.gtag("event", "first_contentful_paint", {
                event_category: "Performance",
                event_label: "home_page",
                value: Math.round(fcp),
                non_interaction: true,
              });
            }

            if (process.env.NODE_ENV === "development") {
              console.log(`[Performance] First Contentful Paint: ${fcp.toFixed(2)}ms`);
            }
          }
        }
      });

      try {
        observer.observe({ entryTypes: ["paint"] });
      } catch {
        // PerformanceObserver might not be supported in all browsers
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
}

