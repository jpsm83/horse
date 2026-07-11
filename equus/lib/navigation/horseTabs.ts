import type { EntityTab } from "@/components/ui/entity-tabs.tsx";

export function getHorseTabs(horseId: string): EntityTab[] {
  return [
    { id: "hub", label: "Hub", href: `/horses/${horseId}` },
    { id: "edit", label: "Edit", href: `/horses/${horseId}/edit`, requireOwnership: true },
    { id: "sale", label: "Sale", href: `/horses/${horseId}/sale`, requireOwnership: true },
    { id: "discovery", label: "Discovery", href: `/horses/${horseId}/discovery`, requireOwnership: true },
    { id: "history", label: "History", href: `/horses/${horseId}/history` },
    { id: "relations", label: "Relations", href: `/horses/${horseId}/relations` },
  ];
}
