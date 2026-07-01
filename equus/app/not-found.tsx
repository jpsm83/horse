/**
 * Non-localized 404 fallback for requests outside the [locale] tree
 * (e.g. static files excluded from the proxy matcher). Rewrites into `[locale]`
 * are handled by `proxy.ts` — send visitors to the guest landing instead of
 * rendering links without next-intl (see `documentation/i18n.md`).
 */

import { redirect } from "next/navigation";

export default function NotFound() {
  redirect("/");
}
