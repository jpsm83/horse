import type { EntityTab } from "@/components/shared/entity-tabs.tsx";

export function getHorseTabs(horseId: string): EntityTab[] {
  return [
    { id: "hub", label: "Hub", href: `/horses/${horseId}` },
    { id: "connect", label: "Connect", href: `/horses/${horseId}/connect`, requireOwnership: true },
    { id: "planning", label: "Planning", href: `/horses/${horseId}/planning` },
    { id: "media", label: "Media", href: `/horses/${horseId}/media` },
    { id: "documents", label: "Documents", href: `/horses/${horseId}/documents` },
    { id: "edit", label: "Edit", href: `/horses/${horseId}/edit`, requireOwnership: true },
    { id: "admin", label: "Admin", href: `/horses/${horseId}/admin`, requireOwnership: true, requireMainOwner: true },
    { id: "history", label: "History", href: `/horses/${horseId}/history` },
  ];
}
