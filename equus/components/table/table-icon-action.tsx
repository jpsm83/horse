/**
 * TableIconAction — ghost icon row action (Admin remove / Documents download+delete).
 */

"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TableIconActionProps = Omit<ComponentProps<typeof Button>, "variant" | "size">;

export function TableIconAction({ className, type = "button", ...props }: TableIconActionProps) {
  return (
    <Button
      type={type}
      variant="ghost"
      size="icon"
      className={cn(className)}
      {...props}
    />
  );
}
