"use client";

import {
  Bell,
  LogOut,
  UserRound,
  UserRoundPen,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { filterMyOwnLinks } from "@/components/layout/navigation-config.ts";
import type { AppAuthState } from "@/hooks/use-app-auth.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  auth: AppAuthState;
};

/** Right header menu — account actions and owned-profile links (health app pattern). */
export function UserMenu({ auth }: UserMenuProps) {
  const t = useTranslations("header");
  const tMyOwn = useTranslations("header.myOwn");
  const tCommon = useTranslations("common");

  const myOwnLinks = filterMyOwnLinks(auth.ownedNavigation);
  const hasMyOwn = myOwnLinks.length > 0;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}
        aria-label={t("openUserMenu")}
        suppressHydrationWarning
      >
        <Avatar size="sm" className="size-8">
          {auth.profileImageUrl ? (
            <AvatarImage src={auth.profileImageUrl} alt="" />
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
                {auth.displayName ?? auth.user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{auth.user.email}</p>
            </div>
            <DropdownMenuSeparator />
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
