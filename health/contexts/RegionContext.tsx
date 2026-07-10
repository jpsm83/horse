"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface RegionContextType {
  region: string;
  setRegion: (region: string) => void;
  isLoading: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ 
  children, 
  initialRegion 
}: { 
  children: ReactNode; 
  initialRegion?: string;
}) {
  const [region, setRegion] = useState<string>(initialRegion || "US");
  const [isLoading, setIsLoading] = useState<boolean>(!initialRegion);

  // Only fetch on client if no initial region provided
  useEffect(() => {
    if (!initialRegion && typeof window !== "undefined") {
      // Try to get from localStorage first (persist across navigation)
      const cachedRegion = localStorage.getItem("userRegion");
      if (cachedRegion) {
        setRegion(cachedRegion);
        setIsLoading(false);
        return;
      }

      // Fallback to browser language if no cache
      try {
        const browserLanguage = navigator.language || "en-US";
        const browserRegion = browserLanguage.split("-")[1] || "US";
        const normalizedRegion = browserRegion.toUpperCase();
        setRegion(normalizedRegion);
        setIsLoading(false);
        // Cache it
        localStorage.setItem("userRegion", normalizedRegion);
      } catch (error) {
        console.error("Region detection failed:", error);
        setIsLoading(false);
      }
    } else if (initialRegion) {
      // Cache the server-provided region
      if (typeof window !== "undefined") {
        localStorage.setItem("userRegion", initialRegion);
      }
      setIsLoading(false);
    }
  }, [initialRegion]);

  // Update localStorage when region changes
  useEffect(() => {
    if (typeof window !== "undefined" && region) {
      localStorage.setItem("userRegion", region);
    }
  }, [region]);

  return (
    <RegionContext.Provider value={{ region, setRegion, isLoading }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
}

