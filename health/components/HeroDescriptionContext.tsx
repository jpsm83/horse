"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface HeroDescriptionContextType {
  description: string;
  setDescription: (description: string) => void;
}

export const HeroDescriptionContext = createContext<HeroDescriptionContextType | null>(null);

export function HeroDescriptionProvider({
  children,
  initialDescription,
}: {
  children: ReactNode;
  initialDescription: string;
}) {
  const [description, setDescription] = useState(initialDescription);

  return (
    <HeroDescriptionContext.Provider value={{ description, setDescription }}>
      {children}
    </HeroDescriptionContext.Provider>
  );
}

export function useHeroDescription() {
  const context = useContext(HeroDescriptionContext);
  if (!context) {
    throw new Error(
      "useHeroDescription must be used within HeroDescriptionProvider"
    );
  }
  return context;
}

