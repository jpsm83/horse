"use client";

import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { HorseEventsCalendar } from "@/components/horses/planning/horse-events-calendar.tsx";
import { useHorsePlanning } from "@/hooks/queries/useHorsePlanning.ts";
import { useHorseProviders } from "@/hooks/queries/useHorse.ts";
import type { CalendarEvent } from "@/hooks/queries/useHorsePlanning.ts";

type Props = {
  horseId: string;
  isAdmin: boolean;
};

export function HorsePlanningCalendarSection({ horseId, isAdmin }: Props) {
  const t = useTranslations("horsePlanning");
  const { data: events = [], isPending, isError } = useHorsePlanning(horseId);
  const { data: providers = [] } = useHorseProviders(horseId, "accepted");

  const calendarEvents: CalendarEvent[] = events.map((e) => {
    const isProviderLinked =
      e.sourceEntityType &&
      e.sourceEntityId &&
      providers.some(
        (p) =>
          p.relationshipType === e.sourceEntityType && p.receiverAccountId === e.sourceEntityId,
      );
    return { ...e, backgroundColor: isProviderLinked ? "var(--info)" : undefined };
  });

  if (isPending) {
    return <HorsePlanningCalendarSkeleton />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">{t("loadFailed")}</p>;
  }

  return (
    <HorseEventsCalendar
      horseId={horseId}
      events={calendarEvents}
      isAdmin={isAdmin}
    />
  );
}

function HorsePlanningCalendarSkeleton() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Spinner className="size-6" />
      </div>
      <Skeleton className="inset-0 h-full w-full p-4 rounded-md" />
    </div>
  );
}
