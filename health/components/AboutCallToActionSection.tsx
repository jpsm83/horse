"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AboutCallToActionSectionProps {
  locale: string;
  title: string;
  description: string;
  button: string;
}

export default function AboutCallToActionSection({
  locale,
  title,
  description,
  button,
}: AboutCallToActionSectionProps) {
  return (
    <div className="text-center bg-gradient-left-right p-6 md:p-12 space-y-4 md:space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white">
        {title}
      </h2>
      <p className="text-md md:text-lg text-white max-w-2xl mx-auto">
        {description}
      </p>
      <Button className="w-3/4 md:w-1/3 mx-auto">
        <Link href={`/${locale}`}>{button}</Link>
      </Button>
    </div>
  );
}

