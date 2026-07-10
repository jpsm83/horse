"use client";

import { Button } from "@/components/ui/button";

interface ScrollToButtonProps {
  targetId: string;
  children: React.ReactNode;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function ScrollToButton({
  targetId,
  children,
  size = "lg",
  className = "w-auto",
}: ScrollToButtonProps) {
  const handleClick = () => {
    const element = document.getElementById(targetId);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Button size={size} className={className} onClick={handleClick}>
      {children}
    </Button>
  );
}

