import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    ignores: ["components/icons/google-icon.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
          message:
            "Do not use hex color literals in components/app. Use semantic tokens from globals.css (or nonCssColors for non-CSS contexts).",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9A-Fa-f]{3,8}/]",
          message:
            "Do not embed hex colors in template strings in components/app. Use semantic tokens from globals.css.",
        },
      ],
    },
  },
]);

export default eslintConfig;
