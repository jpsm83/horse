/**
 * PlanningCalendarSection  calendar for the Planning tab.
 *
 * Owns data fetching, provider-event colorization, and inline skeleton.
 * Clicking a date opens a dialog to create an event.
 * Errors are caught by the parent ErrorBoundary wrapper.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { EventsCalendar } from "@/components/shared/events-calendar";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHorsePlanning } from "@/hooks/queries/useHorsePlanning.ts";
import { useHorseProviders } from "@/hooks/queries/useHorse.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { queryKeys } from "@/lib/api/queryKeys";

type Props = { horseId: string };

function EventForm({ horseId, defaultDate, onSaved }: { horseId: string; defaultDate: string; onSaved: () => void }) {
  const t = useTranslations("horsePlanning");
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState("appointment");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [sourceProviderId, setSourceProviderId] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: providers = [] } = useHorseProviders(horseId, "accepted");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { eventType, title: title.trim(), startDate };
      if (endDate) body.endDate = endDate;
      if (location.trim()) body.location = location.trim();
      if (sourceProviderId) {
        const p = providers.find((pr) => pr.id === sourceProviderId);
        if (p) { body.sourceEntityType = p.relationshipType; body.sourceEntityId = p.receiverAccountId; }
      }

      const res = await fetch("/api/v1/horses/" + horseId + "/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(t("eventCreated"));
        queryClient.invalidateQueries({ queryKey: queryKeys.horses.planning(horseId) });
        onSaved();
      } else {
        toast.error(t("eventError"));
      }
    } catch {
      toast.error(t("eventError"));
    } finally {
      setSaving(false);
    }
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
      <Button type="submit" disabled={saving || !title.trim() || !startDate} className="w-full">
        {saving ? t("saving") : t("saveEvent")}
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


