/**
 * Hex color mirrors of `:root` (default theme) tokens in `app/globals.css`
 * for contexts that cannot use CSS variables (HTML email, Excel export, meta).
 *
 * Keep in sync with `:root` — enforced by `tests/theme/nonCssColorsSync.test.ts`.
 * User-selected themes (e.g. onyx) do not affect these values.
 */

export const nonCssColors = {
  primary: "#b8520a",
  primaryForeground: "#ffffff",
  muted: "#2a3b42",
  border: "#445a4d",
  foreground: "#f3f4f6",
  mutedForeground: "#e5e7eb",
  /** Same as primary — used for email links and browser theme-color. */
  link: "#b8520a",
  browserThemeColor: "#b8520a",
  /** Excel export gridlines / header fill (also defined on `:root`). */
  excelGridline: "#000000",
  excelHeaderFill: "#d1d0ce",
  badgeBands: {
    gray: { background: "#5c5b5b", foreground: "#ffffff" },
    yellow: { background: "#ecd6a7", foreground: "#92400e" },
    green: { background: "#addfc0", foreground: "#166534" },
    red: { background: "#f3cbcb", foreground: "#991b1b" },
    orange: { background: "#f8c5aa", foreground: "#c2410c" },
    blue: { background: "#b3c8f8", foreground: "#1e40af" },
    purple: { background: "#d9b8f8", foreground: "#7e22ce" },
    pink: { background: "#f2b3cf", foreground: "#be185d" },
    neutral: { background: "#e5e7eb", foreground: "#6b7280" },
  },
} as const;

export type BadgeBandKey = keyof typeof nonCssColors.badgeBands;

/** Strip `#` and return uppercase RRGGBB for ExcelJS `argb` fields. */
export function hexToExcelArgb(hex: string): string {
  return hex.replace(/^#/, "").toUpperCase();
}
