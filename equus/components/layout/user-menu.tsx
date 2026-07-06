"use client";

import {
  Bell,
  Building2,
  Home,
  LogOut,
  UserRound,
  UserRoundPen,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  CREATE_MENU_BUSINESS_LINKS,
  CREATE_MENU_HORSE_LINK,
  CREATE_MENU_SERVICE_LINKS,
  filterMyOwnLinks,
  USER_ACTIVITY_LINKS,
} from "@/components/layout/navigation-config.ts";
import type { AppAuthState } from "@/hooks/use-app-auth.ts";
import { useUserNavigation, useUserProfile } from "@/hooks/queries/useCurrentUser.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation.ts";
import { resolveAppHomePath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  auth: AppAuthState;
};

/** Right header menu — account actions, create shortcuts, and owned-profile links. */
export function UserMenu({ auth }: UserMenuProps) {
  const t = useTranslations("header");
  const tAccount = useTranslations("header.account");
  const tCreate = useTranslations("header.create");
  const tCreateItems = useTranslations("header.create.items");
  const tMyOwn = useTranslations("header.myOwn");
  const tCommon = useTranslations("common");

  const { data: ownedNavigation } = useUserNavigation(auth.isAuthenticated);
  const { data: profile } = useUserProfile(auth.isAuthenticated);

  const myOwnLinks = filterMyOwnLinks(auth.isAuthenticated ? (ownedNavigation ?? null) : null);
  const hasMyOwn = myOwnLinks.length > 0;
  const HorseIcon = CREATE_MENU_HORSE_LINK.icon;
  const homeHref = resolveAppHomePath(auth.isAuthenticated);

  const details = auth.isAuthenticated ? (profile?.personalDetails ?? {}) : {};
  const profileFirstName = typeof details.firstName === "string" ? details.firstName : undefined;
  const profileLastName = typeof details.lastName === "string" ? details.lastName : undefined;
  const profileImageUrlValue = typeof details.imageUrl === "string" ? details.imageUrl.trim() || undefined : undefined;
  const displayName = auth.user
    ? [profileFirstName, profileLastName].filter(Boolean).join(" ") || auth.user.email
    : null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}
        aria-label={t("openUserMenu")}
        suppressHydrationWarning
      >
        <Avatar size="sm" className="size-8">
          {profileImageUrlValue ? (
            <AvatarImage src={profileImageUrlValue} alt="" />
          ) : null}
          <AvatarFallback>
            <UserRound className="size-4" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-56">
        {auth.isAuthenticated && auth.user ? (
          <>
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium">
                {displayName ?? auth.user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{auth.user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={homeHref} className="flex w-full cursor-pointer items-center gap-2">
                <Home className="size-4" />
                {t("home")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/profile" className="flex w-full cursor-pointer items-center gap-2">
                <UserRoundPen className="size-4" />
                {t("profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/notifications" className="flex w-full cursor-pointer items-center gap-2">
                <Bell className="size-4" />
                {t("notifications")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              {tAccount("sectionLabel")}
            </p>
            {USER_ACTIVITY_LINKS.map(({ key, href, icon: Icon }) => (
              <DropdownMenuItem key={key}>
                <Link href={href} className="flex w-full cursor-pointer items-center gap-2">
                  <Icon className="size-4" />
                  {tAccount(key)}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              {tCreate("sectionLabel")}
            </p>
            <DropdownMenuItem>
              <Link
                href={CREATE_MENU_HORSE_LINK.href}
                className="flex w-full cursor-pointer items-center gap-2"
              >
                <HorseIcon className="size-4" />
                {tCreate("addHorse")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Building2 className="size-4" />
                {tCreate("createBusiness")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {CREATE_MENU_BUSINESS_LINKS.map(({ key, href, icon: Icon }) => (
                  <DropdownMenuItem key={key}>
                    <Link href={href} className="flex w-full cursor-pointer items-center gap-2">
                      <Icon className="size-4" />
                      {tCreateItems(key)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Wrench className="size-4" />
                {tCreate("addService")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {CREATE_MENU_SERVICE_LINKS.map(({ key, href, icon: Icon }) => (
                  <DropdownMenuItem key={key}>
                    <Link href={href} className="flex w-full cursor-pointer items-center gap-2">
                      <Icon className="size-4" />
                      {tCreateItems(key)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {hasMyOwn ? (
              <>
                <DropdownMenuSeparator />
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {tMyOwn("sectionLabel")}
                </p>
                {myOwnLinks.map(({ key, href, icon: Icon }) => (
                  <DropdownMenuItem key={key}>
                    <Link href={href} className="flex w-full cursor-pointer items-center gap-2">
                      <Icon className="size-4" />
                      {tMyOwn(key)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={auth.isLoading}
              onClick={() => void auth.logout()}
            >
              <LogOut className="size-4" />
              {tCommon("signOut")}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem>
              <Link href={homeHref} className="flex w-full cursor-pointer items-center gap-2">
                <Home className="size-4" />
                {t("home")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/signin" className="flex w-full cursor-pointer items-center gap-2">
                <UserRound className="size-4" />
                {tCommon("signIn")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/signup" className="flex w-full cursor-pointer items-center gap-2">
                <UserRoundPen className="size-4" />
                {tCommon("signUp")}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
