import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { mainCategories, categoryHeroImages } from "@/lib/constants";
import { optimizeCloudinaryUrl } from "@/lib/utils/optimizeCloudinaryUrl";
import { translateCategoryToLocale } from "@/lib/utils/routeTranslation";
import {
  Activity,
  Dumbbell,
  Apple,
  Heart,
  Palette,
  TrendingDown,
  Coffee,
  LucideIcon,
} from "lucide-react";

interface CategoryCardsProps {
  locale: string;
}

// Category icons mapping - same as Navbar
const categoryIcons: Record<string, LucideIcon> = {
  health: Activity,
  fitness: Dumbbell,
  nutrition: Apple,
  intimacy: Heart,
  beauty: Palette,
  "weight-loss": TrendingDown,
  life: Coffee,
};

export default async function CategoryCards({ locale }: CategoryCardsProps) {
  const t = await getTranslations({ locale, namespace: "articleCard" });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 p-4 md:p-8">
      {mainCategories.map((category) => {
        const categoryImage =
          categoryHeroImages[category as keyof typeof categoryHeroImages] ||
          categoryHeroImages.health;
        const categoryUrl = `/${locale}/${translateCategoryToLocale(category, locale)}`;
        const categoryTitle = t(`categories.${category}`);
        const Icon = categoryIcons[category];

        return (
          <Link
            key={category}
            href={categoryUrl}
            className="group relative h-32 md:h-40 overflow-hidden shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Image
              src={optimizeCloudinaryUrl(categoryImage, 80)}
              alt={categoryTitle}
              fill
              className="object-cover group-hover:scale-103 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.7)_30%,rgba(0,0,0,0)_80%)]" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2">
                {Icon && (
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-lg shrink-0" />
                )}
                <h3 className="text-white font-semibold text-lg drop-shadow-lg font-[Open_Sans]">
                  {categoryTitle}
                </h3>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

