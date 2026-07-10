"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Menu,
  Activity,
  Dumbbell,
  Apple,
  Palette,
  TrendingDown,
  Coffee,
  Search,
} from "lucide-react";
import { mainCategories } from "@/lib/constants";
import { translateCategoryToLocale } from "@/lib/utils/routeTranslation";
import { useSession, signOut } from "next-auth/react";
import UserDropdownMenu from "./UserDropdownMenu";
import SearchPopup from "./SearchPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("navigation");
  const { data: session } = useSession();

  const homeHref = locale === "en" ? "/" : `/${locale}`;
  const searchTerm = searchParams.get("q") || "";
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  // Sync search term with URL
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Detect mobile and handle scroll visibility
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Handle scroll-based navbar visibility (mobile only)
    const handleScroll = () => {
      if (!isMobile) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else {
        setIsVisible(currentScrollY < lastScrollY.current);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobile]);

  // Handlers
  const handleSearch = () => {
    if (localSearchTerm.trim()) {
      const base = locale === "en" ? "" : `/${locale}`;
      // Close popup immediately, navigate immediately
      setIsSearchPopupOpen(false);
      router.push(
        `${base}/search?q=${encodeURIComponent(localSearchTerm.trim())}`
      );
    } else {
      setIsSearchPopupOpen(false);
      router.push(homeHref);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push(homeHref);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const translations = {
    search: t("search"),
    profile: t("profile"),
    favorites: t("favorites"),
    dashboard: t("dashboard"),
    createArticle: t("createArticle"),
    signOut: t("signOut"),
    signIn: t("signIn"),
    signUp: t("signUp"),
  };

  // Category icons mapping
  const categoryIcons: Record<string, React.ReactNode> = {
    health: <Activity size={16} className="text-red-600" />,
    fitness: <Dumbbell size={16} className="text-red-600" />,
    nutrition: <Apple size={16} className="text-red-600" />,
    intimacy: <Heart size={16} className="text-red-600" />,
    beauty: <Palette size={16} className="text-red-600" />,
    "weight-loss": <TrendingDown size={16} className="text-red-600" />,
    life: <Coffee size={16} className="text-red-600" />,
  };

  // Helper to generate category URL
  const getCategoryUrl = (category: string) =>
    `/${locale}/${translateCategoryToLocale(category, locale)}`;

  return (
    <nav
      className={`bg-gradient-left-right text-white shadow-lg fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      suppressHydrationWarning
    >
      {/* Single navbar container */}
      <div className="flex justify-between items-center h-16 px-6 sm:px-12 lg:px-8 border-b-2 border-gray-200">
        {/* Left: Logo */}
        <Link
          href={homeHref}
          className="flex items-center space-x-2"
        >
          <Heart size={24} />
          <span
            className="text-lg md:text-2xl font-bold"
            style={{
              textShadow:
                "1px 1px 2px rgba(0,0,0,0.6), 0 0 6px rgba(0,0,0,0.4)",
            }}
          >
            {t("brandName")}
          </span>
        </Link>

        {/* Right: Categories + Search + Avatar */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop: Category buttons */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            {mainCategories.map((category) => (
              <Button
                key={category}
                size="sm"
                asChild
                className="text-white bg-transparent border-none shadow-none text-sm whitespace-nowrap hover:bg-transparent hover:scale-110 transition-all duration-200"
              >
                <Link
                  href={getCategoryUrl(category)}
                  prefetch={false}
                  style={{
                    textShadow:
                      "2px 2px 4px rgba(0,0,0,0.4), 0 0 8px rgba(0,0,0,0.4)",
                  }}
                >
                  {t(`categories.${category}`)}
                </Link>
              </Button>
            ))}
          </div>

          {/* Desktop: Search icon */}
          <div className="hidden md:block">
            <Button
              size="icon"
              onClick={() => setIsSearchPopupOpen(true)}
              className="text-white bg-transparent border-none shadow-none hover:bg-white/20 rounded-full cursor-pointer"
              aria-label="Search"
            >
              <Search size={20} />
            </Button>
          </div>

          {/* Mobile: Burger menu with categories */}
          <div className="md:hidden">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="text-white bg-transparent border-none shadow-none hover:bg-white/20 rounded-full cursor-pointer"
                  aria-label="Open categories menu"
                  suppressHydrationWarning
                >
                  <Menu size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[200px] bg-white shadow-lg border border-gray-200"
                align="end"
                side="bottom"
                sideOffset={4}
              >
                {/* Search at the top */}
                <DropdownMenuItem
                  onClick={() => setIsSearchPopupOpen(true)}
                  className="cursor-pointer"
                >
                  <Search size={16} className="text-red-600" />{" "}
                  {translations.search}
                </DropdownMenuItem>
                {/* Separator */}
                <DropdownMenuSeparator />
                {/* Categories */}
                {mainCategories.map((category) => (
                  <DropdownMenuItem key={category} asChild>
                    <Link
                      href={getCategoryUrl(category)}
                      className="cursor-pointer"
                      prefetch={false}
                    >
                      {categoryIcons[category]} {t(`categories.${category}`)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Avatar button (both mobile and desktop) */}
          <UserDropdownMenu
            session={session}
            locale={locale}
            onLogout={handleLogout}
            translations={translations}
          />
        </div>
      </div>

      {/* Search Popup */}
      <SearchPopup
        isOpen={isSearchPopupOpen}
        searchTerm={localSearchTerm}
        placeholder={t("searchPlaceholder")}
        onClose={() => setIsSearchPopupOpen(false)}
        onSearch={handleSearch}
        onClear={() => setLocalSearchTerm("")}
        onSearchChange={setLocalSearchTerm}
      />
    </nav>
  );
}
