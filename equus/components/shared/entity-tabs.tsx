"use client";

import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useUnsavedChangesOptional } from "@/components/shared/unsaved-changes-context.tsx";
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
  "sticky top-[var(--sticky-chrome-offset,0px)] z-20 flex h-14 w-full items-center justify-center bg-nav-tab-background text-nav-tab-foreground";

export function EntityTabs({ tabs, isAdmin, isMainOwner, isPending }: EntityTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const unsavedChanges = useUnsavedChangesOptional();

  if (isPending) {
    return (
      <nav className={`${navClassName} px-4 sm:px-6 py-3`}>
        <Skeleton className="h-full w-full rounded-lg bg-nav-tab-foreground/15" />
      </nav>
    );
  }

  const visibleTabs = tabs.filter((t) => {
    if (t.requireMainOwner) return isMainOwner;
    if (t.requireOwnership) return isAdmin;
    return true;
  });

  if (visibleTabs.length <= 1) return null;

  function handleTabNavigate(event: MouseEvent, href: string, isActive: boolean) {
    if (isActive) {
      event.preventDefault();
      return;
    }
    if (unsavedChanges?.isDirty) {
      event.preventDefault();
      unsavedChanges.requestNavigation(href);
      return;
    }
    event.preventDefault();
    router.push(href);
  }

  return (
    <nav className={navClassName}>
      <div className="inline-flex items-center gap-1 rounded-lg p-1">
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
              onClick={(event) => handleTabNavigate(event, tab.href, isActive)}
              className={cn(
                "relative inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-0.5 text-sm font-medium whitespace-nowrap transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-nav-tab-foreground hover:bg-primary/20 hover:text-primary-foreground",
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
