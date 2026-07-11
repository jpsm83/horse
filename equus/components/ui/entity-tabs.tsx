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
}

export function EntityTabs({ tabs, isOwner, isPending }: EntityTabsProps) {
  const pathname = usePathname();

  const visibleTabs = tabs.filter((t) => !t.requireOwnership || isOwner);

  if (isPending || visibleTabs.length <= 1) return null;

  return (
    <nav className="mb-6 flex items-center gap-1 rounded-lg bg-muted p-[3px] w-fit">
      {visibleTabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === "/"
            : pathname === tab.href || pathname.startsWith(tab.href + "/");

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
