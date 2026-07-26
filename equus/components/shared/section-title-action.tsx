/**
 * SectionTitleAction — section `titleAddon` action using the theme default Button.
 */

"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SectionTitleActionProps = Omit<ComponentProps<typeof Button>, "variant" | "size">;

export function SectionTitleAction({
  className,
  type = "button",
  ...props
}: SectionTitleActionProps) {
  return <Button type={type} className={cn(className)} {...props} />;
}
