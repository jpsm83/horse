/**
 * TableUserAvatarCell — centered round avatar for horse DataTables (Admin History SoT).
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type TableUserAvatarCellProps = {
  imageUrl?: string;
  initials: string;
};

export function TableUserAvatarCell({ imageUrl, initials }: TableUserAvatarCellProps) {
  return (
    <div className="flex w-full items-center justify-center">
      <Avatar size="sm" className="rounded-full">
        {imageUrl ? (
          <AvatarImage src={imageUrl} alt="" className="object-cover" />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </div>
  );
}
