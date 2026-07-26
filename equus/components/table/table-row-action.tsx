/**
 * TableRowAction — labeled row action using the theme default Button
 * (same look as Admin History "Change owner").
 */

"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TableRowActionProps = Omit<ComponentProps<typeof Button>, "variant" | "size">;

export function TableRowAction({ className, type = "button", ...props }: TableRowActionProps) {
  return <Button type={type} className={cn(className)} {...props} />;
}
