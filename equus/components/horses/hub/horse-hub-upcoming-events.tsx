"use client";

import { useTranslations } from "next-intl";

import type { HorseHubPlanningItem } from "@/lib/services/horseService.ts";

type HorseHubUpcomingEventsProps = {
  events: HorseHubPlanningItem[];
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function HorseHubUpcomingEvents({ events }: HorseHubUpcomingEventsProps) {
  const t = useTranslations("horseHub");
  const shown = events.slice(0, 5);

  if (shown.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("eventsEmpty")}</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {shown.map((event) => (
        <li key={event.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium leading-snug">{event.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatDate(event.startDate)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">{event.eventType}</span>
            {event.location && (
              <span className="text-xs text-muted-foreground">· {event.location}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
