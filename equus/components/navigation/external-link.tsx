/**
 * External URLs only — `mailto:`, `tel:`, and `https:` links.
 * In-app routes must use `Link` from `@/i18n/navigation`, not native `<a>`.
 */

import { cn } from "@/lib/utils";

type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a
      href={href}
      className={cn(className)}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      target={href.startsWith("http") ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}
