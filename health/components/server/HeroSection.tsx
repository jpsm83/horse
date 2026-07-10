import Image from "next/image";
import Link from "next/link";
import { optimizeCloudinaryUrl } from "@/lib/utils/optimizeCloudinaryUrl";
import HeroDescription from "@/components/HeroDescription";
import { Button } from "@/components/ui/button";
import ScrollToButton from "@/components/ScrollToButton";

interface HeroSectionProps {
  title: string;
  description: string;
  imageUrl: string;
  alt: string;
  buttonHref?: string;
  buttonText?: string;
}

export default function HeroSection({
  title,
  description,
  imageUrl,
  alt,
  buttonHref,
  buttonText,
}: HeroSectionProps) {

  return (
    <section 
      className="relative w-full h-[55vh] min-h-[360px] md:h-[70vh] md:min-h-[500px]"
      data-no-ad
    >
      {/* Background Image */}
      <div className="absolute inset-0" data-no-ad>
        <Image
          src={optimizeCloudinaryUrl(imageUrl, 85)}
          alt={alt}
          className="w-full h-full object-cover"
          fill
          sizes="100vw"
          fetchPriority="high"
          priority
          quality={85}
        />
      </div>

      {/* Gradient Overlay - 50% #f53b80 to transparent at 2/3 */}
      <div
        className="absolute inset-0 z-10"
        data-no-ad
        style={{
          background:
            "linear-gradient(to right, rgb(0,0,0, 0.8) 0%, rgb(0,0,0, 0.7) 30%, transparent 80%)",
        }}
      />

      {/* Content - aligned to left */}
      <div className="relative z-20 flex items-center h-full px-6 sm:px-12 lg:px-16" data-no-ad>
        <div className="flex flex-col gap-4 md:gap-6 text-left text-white max-w-2xl" data-no-ad>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold font-[Open_Sans]"
            data-no-ad
            style={{
              textShadow:
                "2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)",
            }}
          >
            {title}
          </h1>
          <div data-no-ad>
            <HeroDescription fallbackDescription={description} />
          </div>
          {buttonHref && buttonText && (
            <div className="pt-2" data-no-ad>
              {buttonHref.startsWith("#") ? (
                <ScrollToButton targetId={buttonHref.slice(1)}>
                  {buttonText}
                </ScrollToButton>
              ) : (
                <Button asChild size="lg" className="w-auto">
                  <Link href={buttonHref}>{buttonText}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
