"use client";

import {
  Heart,
  Zap,
  HeartHandshake,
  Activity,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface Category {
  key: string;
  iconName: string;
}

interface AboutCategoriesSectionProps {
  categories: Category[];
}

const iconMap: Record<string, LucideIcon> = {
  Heart,
  Zap,
  HeartHandshake,
  Activity,
  Sparkles,
};

export default function AboutCategoriesSection({
  categories,
}: AboutCategoriesSectionProps) {
  const t = useTranslations("about");

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {categories.map((category) => {
        const IconComponent = iconMap[category.iconName];
        if (!IconComponent) {
          return null;
        }
        return (
          <div
            key={category.key}
            className="text-center p-4 md:p-6 bg-purple-50 shadow-md"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-left-right rounded-full flex items-center justify-center mx-auto mb-4">
              <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              {t(`whatWeCover.${category.key}.title`)}
            </h3>
            <p className="text-gray-700">
              {t(`whatWeCover.${category.key}.description`)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

