/**
 * Shared email types for Equus transactional templates.
 */

import type { AppLocale } from "@/i18n/resolveLocale.ts";

export type EmailTemplateContent = {
  subject: string;
  html: string;
  text: string;
};

export type EmailLocale = AppLocale;
