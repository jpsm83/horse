"use client";

import { horseHead } from "@lucide/lab";
import {
  Bell,
  Briefcase,
  CreditCard,
  Icon,
  Link2,
  LogOut,
  UserRound,
  UserRoundPen,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DISCOVER_LINKS,
} from "@/components/layout/navigation-config.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserProfile } from "@/hooks/queries/useCurrentUser.ts";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { resolveAppHomePath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  onHoverChange: (hovered: boolean) => void;
};

export function AppSidebar({ onHoverChange }: AppSidebarProps) {
  const t = useTranslations("header");
  const tDiscover = useTranslations("header.discover");
  const tAccount = useTranslations("header.account");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading: authLoading, logout } = useAppAuth();
  const { data: profile } = useUserProfile(isAuthenticated);
  const homeHref = resolveAppHomePath(isAuthenticated);

  const details = profile?.personalDetails ?? {};
  const profileImageUrlValue =
    typeof details.imageUrl === "string" ? details.imageUrl.trim() || undefined : undefined;
  const displayName = user
    ? [typeof details.firstName === "string" ? details.firstName : undefined,
       typeof details.lastName === "string" ? details.lastName : undefined]
        .filter(Boolean)
        .join(" ") || user.email
    : null;
  const initials = displayName
    ? displayName.split(/\s+/).map((p: string) => p.charAt(0).toUpperCase()).join("").slice(0, 2)
    : "?";

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
              render={<Link href={homeHref} />}
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
          <SidebarGroupLabel>{tDiscover("sectionLabel")}</SidebarGroupLabel>
          <SidebarMenu>
            {DISCOVER_LINKS.map(({ key, href, icon: Icon }) => (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={pathname === href}
                  tooltip={tDiscover(key)}
                >
                  <Icon />
                  <span>{tDiscover(key)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {isAuthenticated && user ? (
          <>
            {/* Avatar + name row */}
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <Avatar className="size-8 shrink-0 rounded-full">
                {profileImageUrlValue ? <AvatarImage src={profileImageUrlValue} alt="" /> : null}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{displayName ?? user.email}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{user.email}</span>
              </div>
            </div>

            {/* Links — hidden when collapsed */}
            <div className="mt-2 space-y-0.5 group-data-[collapsible=icon]:hidden">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link href="/profile" />} isActive={pathname === "/profile"} tooltip={t("profile")}>
                    <UserRoundPen className="size-4" />
                    <span>{t("profile")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link href="/notifications" />} isActive={pathname === "/notifications"} tooltip={t("notifications")}>
                    <Bell className="size-4" />
                    <span>{t("notifications")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link href="/workplaces" />} isActive={pathname === "/workplaces"} tooltip={tAccount("workplaces")}>
                    <Briefcase className="size-4" />
                    <span>{tAccount("workplaces")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link href="/relationships" />} isActive={pathname === "/relationships"} tooltip={tAccount("relationships")}>
                    <Link2 className="size-4" />
                    <span>{tAccount("relationships")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link href="/subscription" />} isActive={pathname === "/subscription"} tooltip={tAccount("subscription")}>
                    <CreditCard className="size-4" />
                    <span>{tAccount("subscription")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={tCommon("signOut")}
                    disabled={authLoading}
                    onClick={() => void logout()}
                    className="cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
                  >
                    <LogOut className="size-4" />
                    <span>{tCommon("signOut")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </>
        ) : (
          <>
            {/* Avatar icon — only visible when collapsed */}
            <div className="flex items-center justify-center group-data-[state=collapsed]:flex group-data-[state=expanded]:hidden">
              <UserRound className="size-5 shrink-0 text-sidebar-foreground" />
            </div>
            {/* Sign in / Sign up — only visible when expanded */}
            <div className="group-data-[state=collapsed]:hidden">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link href="/signin" />} tooltip={tCommon("signIn")}>
                    <UserRound className="size-4" />
                    <span>{tCommon("signIn")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link href="/signup" />} tooltip={tCommon("signUp")}>
                    <UserRoundPen className="size-4" />
                    <span>{tCommon("signUp")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
