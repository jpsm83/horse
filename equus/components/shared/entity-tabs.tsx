"use client";

import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export interface EntityTab {
  id: string;
  label: string;
  href: string;
  requireOwnership?: boolean;
  requireMainOwner?: boolean;
}

interface EntityTabsProps {
  tabs: EntityTab[];
  isAdmin: boolean;
  isMainOwner?: boolean;
  isPending?: boolean;
}

const navClassName =
  "sticky top-[var(--sticky-chrome-offset,0px)] z-20 flex h-14 w-full items-center justify-center bg-nav-tab-background";

export function EntityTabs({ tabs, isAdmin, isMainOwner, isPending }: EntityTabsProps) {
  const pathname = usePathname();

  if (isPending) {
    return (
      <nav className={`${navClassName} px-4 sm:px-6 py-3`}>
        <Skeleton className="h-full w-full rounded-lg" />
      </nav>
    );
  }

  const visibleTabs = tabs.filter((t) => {
    if (t.requireMainOwner) return isMainOwner;
    if (t.requireOwnership) return isAdmin;
    return true;
  });

  if (visibleTabs.length <= 1) return null;

  return (
    <nav className={navClassName}>
      <div className="inline-flex items-center gap-4 rounded-lg bg-nav-tab-background">
        {visibleTabs.map((tab) => {
          const isParentOfOtherTab = visibleTabs.some(
            (t) => t.href !== tab.href && t.href.startsWith(tab.href + "/"),
          );
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href ||
                (!isParentOfOtherTab && pathname.startsWith(tab.href + "/"));

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "relative inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-0.5 text-sm font-medium whitespace-nowrap transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-nav-tab-background text-secondary hover:bg-primary hover:text-primary-foreground",
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
