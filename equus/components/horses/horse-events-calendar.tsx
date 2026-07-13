"use client";

import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { CalendarEvent } from "@/hooks/queries/useHorseEvents";

type Props = {
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
  onDateClick?: (date: string) => void;
};

export function HorseEventsCalendar({ events, onEventClick, onDateClick }: Props) {
  const calendarEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        extendedProps: { eventType: e.eventType, location: e.location },
      })),
    [events],
  );

  return (
    <div className="rounded-lg border p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        eventClick={(info) => onEventClick?.(info.event.id)}
        dateClick={(info) => onDateClick?.(info.dateStr)}
        height="auto"
      />
    </div>
  );
}
