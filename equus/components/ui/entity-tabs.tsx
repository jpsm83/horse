"use client";

import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";

export interface EntityTab {
  id: string;
  label: string;
  href: string;
  requireOwnership?: boolean;
}

interface EntityTabsProps {
  tabs: EntityTab[];
  isOwner: boolean;
  isPending?: boolean;
  variant?: "default" | "header";
}

export function EntityTabs({ tabs, isOwner, isPending, variant = "default" }: EntityTabsProps) {
  const pathname = usePathname();

  const visibleTabs = tabs.filter((t) => !t.requireOwnership || isOwner);

  if (isPending || visibleTabs.length <= 1) return null;

  if (variant === "header") {
    return (
      <nav className="sticky top-0 z-20 flex w-full items-center justify-center border-b bg-background px-4 py-2">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-[3px]">
          {visibleTabs.map((tab) => {
            const isParentOfOtherTab = visibleTabs.some(
              (t) => t.href !== tab.href && t.href.startsWith(tab.href + "/")
            );
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname === tab.href || (!isParentOfOtherTab && pathname.startsWith(tab.href + "/"));

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "relative inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-0.5 text-sm font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="mb-6 flex items-center gap-1 rounded-lg bg-muted p-[3px] w-fit">
      {visibleTabs.map((tab) => {
        const isParentOfOtherTab = visibleTabs.some(
          (t) => t.href !== tab.href && t.href.startsWith(tab.href + "/")
        );
        const isActive =
          tab.href === "/"
            ? pathname === "/"
            : pathname === tab.href || (!isParentOfOtherTab && pathname.startsWith(tab.href + "/"));

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "relative inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-0.5 text-sm font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
