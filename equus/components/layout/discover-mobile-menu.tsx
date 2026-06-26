"use client";

import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";

import { DISCOVER_LINKS } from "@/components/layout/navigation-config.ts";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";

/** Mobile discover nav — round icon trigger, same pattern as UserMenu. */
export function DiscoverMobileMenu() {
  const t = useTranslations("header.discover");
  const pathname = usePathname();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}
        aria-label={t("menuLabel")}
      >
        <Compass className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-56">
        <DropdownMenuLabel>{t("sectionLabel")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DISCOVER_LINKS.map(({ key, href, icon: Icon }) => (
          <DropdownMenuItem key={key}>
            <Link
              href={href}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2",
                pathname === href && "font-medium",
              )}
            >
              <Icon className="size-4" />
              {t(key)}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
