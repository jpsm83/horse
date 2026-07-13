import type { EntityTab } from "@/components/ui/entity-tabs.tsx";

export function getHorseTabs(horseId: string): EntityTab[] {
  return [
    { id: "hub", label: "Hub", href: `/horses/${horseId}` },
    { id: "connect", label: "Connect", href: `/horses/${horseId}/connect`, requireOwnership: true },
    { id: "events", label: "Events", href: `/horses/${horseId}/events` },
    { id: "media", label: "Media", href: `/horses/${horseId}/media` },
    { id: "documents", label: "Documents", href: `/horses/${horseId}/documents` },
    { id: "health", label: "Medical", href: `/horses/${horseId}/health`, requireOwnership: true },
    { id: "feed", label: "Feed", href: `/horses/${horseId}/feed`, requireOwnership: true },
    { id: "edit", label: "Edit", href: `/horses/${horseId}/edit`, requireOwnership: true },
    { id: "admin", label: "Admin", href: `/horses/${horseId}/sale`, requireOwnership: true },
    { id: "history", label: "History", href: `/horses/${horseId}/history` },
  ];
}
