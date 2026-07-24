/**
 * Shared branded HTML layout for Equus transactional emails.
 * Colors come only from `lib/theme/nonCssColors` (mirrors `:root` in globals.css).
 */

import { nonCssColors } from "@/lib/theme/nonCssColors";

const {
  primary,
  primaryForeground,
  muted,
  border,
  foreground,
  mutedForeground,
  link,
} = nonCssColors;

export function buildCtaButton(href: string, label: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${href}"
         style="background: ${primary}; color: ${primaryForeground}; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        ${label}
      </a>
    </div>
  `;
}

/** Heading style for email body copy — use instead of inline hex. */
export function emailHeadingStyle(): string {
  return `color: ${foreground}; margin-bottom: 20px;`;
}

/** Body / muted paragraph style for email copy. */
export function emailBodyStyle(): string {
  return `color: ${mutedForeground}; line-height: 1.6; margin-bottom: 20px;`;
}

export function wrapBrandedEmail(options: {
  bodyHtml: string;
  fallbackMessage: string;
  fallbackLink: string;
  copyright: string;
}): string {
  const { bodyHtml, fallbackMessage, fallbackLink, copyright } = options;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${primary}; color: ${primaryForeground}; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; color: ${primaryForeground};">Equus</h1>
      </div>
      <div style="background-color: ${muted}; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid ${border};">
        ${bodyHtml}
        <hr style="border: none; border-top: 1px solid ${border}; margin: 30px 0;">
        <p style="color: ${mutedForeground}; font-size: 14px; text-align: center;">
          ${fallbackMessage}<br>
          <a href="${fallbackLink}" style="color: ${link};">${fallbackLink}</a>
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: ${mutedForeground}; font-size: 12px;">
        <p>${copyright}</p>
      </div>
    </div>
  `;
}

export function buildPlainTextEmail(sections: string[]): string {
  return sections.filter(Boolean).join("\n\n");
}
