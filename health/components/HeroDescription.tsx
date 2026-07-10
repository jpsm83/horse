"use client";

import { useContext } from "react";
import { HeroDescriptionContext } from "./HeroDescriptionContext";

interface HeroDescriptionProps {
  fallbackDescription?: string; // Fallback if not in Provider
}

export default function HeroDescription({
  fallbackDescription,
}: HeroDescriptionProps) {
  const context = useContext(HeroDescriptionContext);
  const description = context?.description || fallbackDescription || "";

  return (
    <p
      className="text-lg md:text-xl lg:text-2xl text-white drop-shadow-lg"
      style={{
        textShadow: "1px 1px 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.4)",
      }}
    >
      {description}
    </p>
  );
}

