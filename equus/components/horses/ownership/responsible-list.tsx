"use client";

import { Button } from "@/components/ui/button.tsx";
import type { OwnerHorseHubSummary } from "@/lib/services/horseService.ts";

type ResponsibleListProps = {
  responsibles: OwnerHorseHubSummary["responsibles"];
  isMainOwner: boolean;
  onRemove: (userId: string) => void;
};

export function ResponsibleList({ responsibles, isMainOwner, onRemove }: ResponsibleListProps) {
  if (responsibles.length === 0) {
    return <p className="text-sm text-muted-foreground">No responsible persons.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {responsibles.map((r) => (
        <li key={r.userId} className="flex items-center justify-between py-2">
          <span className="text-sm font-medium">{r.label}</span>
          {isMainOwner && (
            <Button size="sm" variant="outline" onClick={() => onRemove(r.userId)}>
              Remove
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
