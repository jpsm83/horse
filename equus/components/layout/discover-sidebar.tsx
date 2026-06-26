"use client";

import { horseHead } from "@lucide/lab";
import { Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DISCOVER_LINKS } from "@/components/layout/navigation-config.ts";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";

type DiscoverSidebarProps = {
  onHoverChange: (hovered: boolean) => void;
};

/** Desktop discover rail — Equus brand on top, expands on hover. Hidden on mobile. */
export function DiscoverSidebar({ onHoverChange }: DiscoverSidebarProps) {
  const t = useTranslations("header.discover");
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      side="left"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <SidebarHeader className="flex h-14 items-center gap-0 border-b border-sidebar-border p-0">
        <SidebarMenu className="w-full">
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              tooltip="Equus"
              className={cn(
                "h-14 items-center rounded-none px-3 text-lg",
                "group-data-[collapsible=icon]:size-14! group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0!",
                "[&_svg]:size-7",
              )}
            >
              <Icon iconNode={horseHead} className="size-7" />
              <span className="truncate text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                Equus
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sectionLabel")}</SidebarGroupLabel>
          <SidebarMenu>
            {DISCOVER_LINKS.map(({ key, href, icon: Icon }) => (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={pathname === href}
                  tooltip={t(key)}
                >
                  <Icon />
                  <span>{t(key)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
