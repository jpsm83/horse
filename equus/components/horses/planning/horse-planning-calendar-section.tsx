"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { HorseEventsCalendar } from "@/components/horses/planning/horse-events-calendar.tsx";
import { HorsePlanningEventForm } from "@/components/horses/planning/horse-planning-event-form.tsx";
import { useHorsePlanning } from "@/hooks/queries/useHorsePlanning.ts";
import { useHorseProviders } from "@/hooks/queries/useHorse.ts";
import type { CalendarEvent } from "@/hooks/queries/useHorsePlanning.ts";

type Props = {
  horseId: string;
  isAdmin: boolean;
};

export function HorsePlanningCalendarSection({ horseId, isAdmin }: Props) {
  const t = useTranslations("horsePlanning");
  const { data: events = [], isPending } = useHorsePlanning(horseId);
  const { data: providers = [] } = useHorseProviders(horseId, "accepted");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

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

  function handleDateClick(dateStr: string) {
    if (!isAdmin) return;
    setSelectedDate(dateStr);
    setDialogOpen(true);
  }

  if (isPending) {
    return <Skeleton className="h-[600px] w-full rounded-lg" />;
  }

  return (
    <>
      <HorseEventsCalendar
        events={calendarEvents}
        onDateClick={isAdmin ? handleDateClick : undefined}
      />
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addEvent")}</DialogTitle>
            </DialogHeader>
            <HorsePlanningEventForm
              key={selectedDate}
              horseId={horseId}
              defaultDate={selectedDate}
              onSaved={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
