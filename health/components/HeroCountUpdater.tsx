"use client";

import { useEffect } from "react";
import { useHeroDescription } from "./HeroDescriptionContext";

interface HeroCountUpdaterProps {
  descriptionText: string;
}

export default function HeroCountUpdater({
  descriptionText,
}: HeroCountUpdaterProps) {
  const { setDescription } = useHeroDescription();

  useEffect(() => {
    if (descriptionText) {
      setDescription(descriptionText);
    }
  }, [descriptionText, setDescription]);

  return null;
}
