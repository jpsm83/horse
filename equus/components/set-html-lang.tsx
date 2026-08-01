"use client";

import { useEffect } from "react";

export function SetHtmlLang({ locale }: { locale: string }) {
  // Necessary imperative DOM: <html> isn't a React-controlled element, so the
  // lang attribute can only be set directly. No declarative alternative exists.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
