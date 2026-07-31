"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { HorsePlanningEventForm } from "@/components/horses/planning/horse-planning-event-form.tsx";
import type { CalendarEvent } from "@/hooks/queries/useHorsePlanning";

type Props = {
  horseId: string;
  events: CalendarEvent[];
  isAdmin: boolean;
};

export function HorseEventsCalendar({ horseId, events, isAdmin }: Props) {
  const locale = useLocale();
  const t = useTranslations("horsePlanning");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: e.backgroundColor,
    extendedProps: { eventType: e.eventType, location: e.location },
  }));

  function handleDateClick(dateStr: string) {
    if (!isAdmin) return;
    setSelectedDate(dateStr);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="flex flex-1 min-h-0 flex-col rounded-lg border border-border bg-card p-4 text-card-foreground">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          dateClick={(info) => handleDateClick(info.dateStr)}
          height="100%"
          expandRows
          navLinks
          dayMaxEvents={3}
          nowIndicator
          fixedWeekCount={false}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
          }}
          locales={[esLocale]}
          locale={locale}
        />
      </div>

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
