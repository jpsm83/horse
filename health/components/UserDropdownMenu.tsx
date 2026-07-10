"use client";

import Link from "next/link";
import Image from "next/image";
import {
  UserRound,
  UserRoundPen,
  LayoutDashboard,
  LogOut,
  Heart,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
interface UserDropdownMenuProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      imageUrl?: string | null;
      role?: string | null;
    } | null;
  } | null;
  locale: string;
  onLogout: () => void;
  translations: {
    search: string;
    profile: string;
    favorites: string;
    dashboard: string;
    createArticle: string;
    signOut: string;
    signIn: string;
    signUp: string;
  };
}

const AVATAR_BUTTON_CLASSNAME =
  "text-white rounded-full bg-transparent border-none shadow-none hover:bg-white/20 cursor-pointer focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0";

export default function UserDropdownMenu({
  session,
  locale,
  onLogout,
  translations,
}: UserDropdownMenuProps) {
  const userImageUrl = session?.user?.imageUrl?.trim();
  const hasUserImage = Boolean(userImageUrl);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className={AVATAR_BUTTON_CLASSNAME}
          aria-label={session?.user ? "Open profile menu" : "Open user menu"}
          suppressHydrationWarning
        >
          {hasUserImage && userImageUrl ? (
            <Image
              src={userImageUrl}
              alt="User"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <UserRound size={20} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[200px] bg-white shadow-lg border border-gray-200"
        align="end"
        side="bottom"
        sideOffset={4}
      >
        {session?.user ? (
          <>
            {/* User info header */}
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/profile`} className="cursor-pointer">
                <UserRoundPen size={16} className="text-red-600" />{" "}
                {translations.profile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/favorites`} className="cursor-pointer">
                <Heart size={16} className="text-red-600" />{" "}
                {translations.favorites}
              </Link>
            </DropdownMenuItem>
            {session?.user?.role === "admin" && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/dashboard`} className="cursor-pointer">
                    <LayoutDashboard size={16} className="text-red-600" />{" "}
                    {translations.dashboard}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/create-article`}
                    className="cursor-pointer"
                  >
                    <FileText size={16} className="text-red-600" />{" "}
                    {translations.createArticle}
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
              <LogOut size={16} className="text-red-600" />{" "}
              {translations.signOut}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/signin`} className="cursor-pointer">
                <UserRound size={16} className="text-red-600" />{" "}
                {translations.signIn}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/signup`} className="cursor-pointer">
                <UserRoundPen size={16} className="text-red-600" />{" "}
                {translations.signUp}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

