/**
 * Shared branded HTML layout for Equus transactional emails.
 * Pattern ported from health/lib/utils/emailTemplates.ts with Equus styling.
 */

const BRAND_GRADIENT = "linear-gradient(to right, #3d4a2c, #6b7c4e)";
const LINK_COLOR = "#5a6b3a";

export function buildCtaButton(href: string, label: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${href}"
         style="background: ${BRAND_GRADIENT}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        ${label}
      </a>
    </div>
  `;
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
      <div style="background: ${BRAND_GRADIENT}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; color: white;">Equus</h1>
      </div>
      <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        ${bodyHtml}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 14px; text-align: center;">
          ${fallbackMessage}<br>
          <a href="${fallbackLink}" style="color: ${LINK_COLOR};">${fallbackLink}</a>
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>${copyright}</p>
      </div>
    </div>
  `;
}

export function buildPlainTextEmail(sections: string[]): string {
  return sections.filter(Boolean).join("\n\n");
}
