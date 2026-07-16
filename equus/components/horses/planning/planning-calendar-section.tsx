"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { EventsCalendar } from "@/components/shared/events-calendar";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHorsePlanning, useCreatePlanningEvent } from "@/hooks/queries/useHorsePlanning.ts";
import { useHorseProviders } from "@/hooks/queries/useHorse.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type Props = { horseId: string };

function EventForm({ horseId, defaultDate, onSaved }: { horseId: string; defaultDate: string; onSaved: () => void }) {
  const t = useTranslations("horsePlanning");
  const toast = useAppToast();
  const createMutation = useCreatePlanningEvent(horseId);
  const [eventType, setEventType] = useState("appointment");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [sourceProviderId, setSourceProviderId] = useState("");

  const { data: providers = [] } = useHorseProviders(horseId, "accepted");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    const body: Record<string, unknown> = { eventType, title: title.trim(), startDate };
    if (endDate) body.endDate = endDate;
    if (location.trim()) body.location = location.trim();
    if (sourceProviderId) {
      const p = providers.find((pr) => pr.id === sourceProviderId);
      if (p) { body.sourceEntityType = p.relationshipType; body.sourceEntityId = p.receiverAccountId; }
    }
    createMutation.mutate(body, {
      onSuccess: () => {
        toast.success(t("eventCreated"));
        onSaved();
      },
      onError: () => toast.error(t("eventError")),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="ev-type">{t("type")}</Label>
        <select id="ev-type" value={eventType} onChange={(e) => setEventType(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
          {["appointment", "competition", "training", "feeding", "other"].map((et) => (
            <option key={et} value={et}>{t("types." + et)}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-title">{t("title")}</Label>
        <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-start">{t("startDate")}</Label>
        <Input id="ev-start" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-end">{t("endDate")}</Label>
        <Input id="ev-end" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ev-loc">{t("location")}</Label>
        <Input id="ev-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      {providers.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="ev-prov">{t("provider")}</Label>
          <select id="ev-prov" value={sourceProviderId} onChange={(e) => setSourceProviderId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
            <option value="">{t("noProvider")}</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.receiverLabel ?? p.relationshipType}</option>
            ))}
          </select>
        </div>
      )}
      <Button type="submit" disabled={createMutation.isPending || !title.trim() || !startDate} className="w-full">
        {createMutation.isPending ? t("saving") : t("saveEvent")}
      </Button>
    </form>
  );
}

export function PlanningCalendarSection({ horseId }: Props) {
  const t = useTranslations("horsePlanning");
  const { data: events = [], isPending } = useHorsePlanning(horseId);
  const { data: providers = [] } = useHorseProviders(horseId, "accepted");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const calendarEvents = useMemo(
    () =>
      events.map((e) => {
        const isProviderLinked = e.sourceEntityType && providers.some(
          (p) => p.relationshipType === e.sourceEntityType && p.receiverAccountId === e.sourceEntityId,
        );
        return { ...e, backgroundColor: isProviderLinked ? "#3b82f6" : undefined };
      }),
    [events, providers],
  );

  const handleDateClick = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setDialogOpen(true);
  }, []);

  if (isPending) {
    return <Skeleton className="h-[600px] w-full rounded-lg" />;
  }

  return (
    <>
      <EventsCalendar events={calendarEvents} onDateClick={handleDateClick} />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addEvent")}</DialogTitle>
          </DialogHeader>
          <EventForm key={selectedDate} horseId={horseId} defaultDate={selectedDate} onSaved={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
