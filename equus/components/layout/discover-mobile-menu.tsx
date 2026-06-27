"use client";

import { horseHead } from "@lucide/lab";
import { Icon } from "lucide-react";
import { useTranslations } from "next-intl";

import { DISCOVER_LINKS } from "@/components/layout/navigation-config.ts";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";

/** Mobile discover nav — horse icon trigger (matches desktop sidebar brand). */
export function DiscoverMobileMenu() {
  const t = useTranslations("header.discover");
  const pathname = usePathname();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}
        aria-label={t("menuLabel")}
      >
        <Icon iconNode={horseHead} className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("sectionLabel")}</DropdownMenuLabel>
          {DISCOVER_LINKS.map(({ key, href, icon: LinkIcon }) => (
            <DropdownMenuItem key={key}>
              <Link
                href={href}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2",
                  pathname === href && "font-medium",
                )}
              >
                <LinkIcon className="size-4" />
                {t(key)}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
