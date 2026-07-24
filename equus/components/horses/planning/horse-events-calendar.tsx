"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { CalendarEvent } from "@/hooks/queries/useHorsePlanning";

type Props = {
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
  onDateClick?: (date: string) => void;
};

export function HorseEventsCalendar({ events, onEventClick, onDateClick }: Props) {
  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: e.backgroundColor,
    extendedProps: { eventType: e.eventType, location: e.location },
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
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
