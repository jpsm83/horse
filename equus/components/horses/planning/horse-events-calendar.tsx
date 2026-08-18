"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import { useChatPopover } from "@/components/chat/chat-popover-provider.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { HorsePlanningEventForm } from "@/components/horses/planning/horse-planning-event-form.tsx";
import type { CalendarEvent } from "@/hooks/queries/useHorsePlanning";
import { buildEventContextPrefix } from "@/lib/chat/buildEventContextPrefix.ts";

type Props = {
  horseId: string;
  horseName: string;
  events: CalendarEvent[];
  isAdmin: boolean;
};

export function HorseEventsCalendar({ horseId, horseName, events, isAdmin }: Props) {
  const locale = useLocale();
  const t = useTranslations("horsePlanning");
  const tMessages = useTranslations("messages");
  const { openChat } = useChatPopover();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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

  function handleEventClick(eventId: string) {
    const event = events.find((entry) => entry.id === eventId);
    if (!event) return;
    setSelectedEvent(event);
  }

  async function handleMessageOperator() {
    if (!selectedEvent?.sourceOperatorUserId) return;
    const contextPrefix = buildEventContextPrefix({
      title: selectedEvent.title,
      start: selectedEvent.start,
      horseName,
    });
    await openChat({
      targetUserId: selectedEvent.sourceOperatorUserId,
      contextPrefix,
    });
    setSelectedEvent(null);
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
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            handleEventClick(info.event.id);
          }}
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

      <Dialog open={selectedEvent != null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {new Date(selectedEvent.start).toLocaleString(locale)}
              </p>
              {isAdmin &&
              selectedEvent.sourceEntityId &&
              selectedEvent.sourceOperatorUserId ? (
                <Button type="button" onClick={() => void handleMessageOperator()}>
                  {tMessages("message")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
