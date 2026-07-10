export const SITE_NAME = "Equus";
export const DOMAIN =
  process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "https://equus.app";

export const DEFAULT_OG_IMAGE = "/og-image.png";

export const languageMap: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
};

export const supportedLocales = ["en", "es"];

export const DEFAULT_OG_WIDTH = 1200;
export const DEFAULT_OG_HEIGHT = 630;
