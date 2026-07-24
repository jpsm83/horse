"use client";

/**
 * Keeps `<html>` theme class + EQUUS_THEME cookie aligned with auth state.
 * Guests always get `default`. Signed-in users use `preferredTheme` from AuthUser.
 */

import { useEffect } from "react";

import { useAppAuth } from "@/hooks/use-app-auth.ts";
import {
  applyThemeToDocument,
  normalizeTheme,
  syncThemeCookie,
} from "@/lib/theme/appTheme.ts";

export function AppThemeSync() {
  const { user, isAuthenticated, isLoading } = useAppAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      const theme = normalizeTheme("default");
      applyThemeToDocument(theme);
      syncThemeCookie(theme);
      return;
    }

    const theme = normalizeTheme(user.preferredTheme);
    applyThemeToDocument(theme);
    syncThemeCookie(theme);
  }, [isAuthenticated, isLoading, user]);

  return null;
}
