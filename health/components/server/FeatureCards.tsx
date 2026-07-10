import { getTranslations } from "next-intl/server";
import {
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  Brain,
  LucideIcon,
} from "lucide-react";

interface FeatureCard {
  icon: LucideIcon;
  mainTextKey: string;
  subTextKey: string;
}

interface FeatureCardsProps {
  locale: string;
}

export default async function FeatureCards({ locale }: FeatureCardsProps) {
  const t = await getTranslations({ locale, namespace: "home.featureCards" });

  const features: FeatureCard[] = [
    {
      icon: ShieldCheck,
      mainTextKey: "everydayHealthBalance.title",
      subTextKey: "everydayHealthBalance.description",
    },
    {
      icon: Sparkles,
      mainTextKey: "realLifeRealWomen.title",
      subTextKey: "realLifeRealWomen.description",
    },
    {
      icon: HeartHandshake,
      mainTextKey: "everyChapterOfWomanhood.title",
      subTextKey: "everyChapterOfWomanhood.description",
    },
    {
      icon: Brain,
      mainTextKey: "smartTrustedContent.title",
      subTextKey: "smartTrustedContent.description",
    },
  ];

  return (
    <section className="bg-[#fefafb] container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 p-4 md:p-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-4"
            >
              {/* Vertical line */}
              <div className="w-0.5 h-full min-h-[60px] bg-rose-200 shrink-0" />
              
              {/* Icon */}
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-left-right rounded-full flex items-center justify-center shrink-0 shadow-lg">
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              
              {/* Text content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-[#972b50] mb-1 md:mb-2">
                  {t(feature.mainTextKey)}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {t(feature.subTextKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

