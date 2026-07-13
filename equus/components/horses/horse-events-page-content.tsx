"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseEventsCalendar } from "@/components/horses/horse-events-calendar.tsx";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
import { SectionVisibilityPopover } from "@/components/ui/section-visibility-popover.tsx";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHorseEvents } from "@/hooks/queries/useHorseEvents.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type Props = { horseId: string };

function HorseEventForm({ horseId, onSaved }: { horseId: string; onSaved: () => void }) {
  const t = useTranslations("horseEvents");
  const toast = useAppToast();
  const [eventType, setEventType] = useState("appointment");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        eventType,
        title: title.trim(),
        startDate,
        allDay,
      };
      if (endDate) body.endDate = endDate;
      if (location.trim()) body.location = location.trim();

      const res = await fetch(`/api/v1/horses/${horseId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(t("eventCreated"));
        onSaved();
        setTitle("");
        setStartDate("");
        setEndDate("");
        setLocation("");
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="eventType">{t("type")}</Label>
          <select
            id="eventType"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {["appointment", "competition", "training", "feeding", "other"].map((et) => (
              <option key={et} value={et}>{t(`types.${et}`)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventTitle">{t("title")}</Label>
          <Input id="eventTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="eventStart">{t("startDate")}</Label>
          <Input id="eventStart" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventEnd">{t("endDate")}</Label>
          <Input id="eventEnd" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="eventLocation">{t("location")}</Label>
        <Input id="eventLocation" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <Button type="submit" disabled={saving || !title.trim() || !startDate}>
        {saving ? t("saving") : t("saveEvent")}
      </Button>
    </form>
  );
}

export function HorseEventsPageContent({ horseId }: Props) {
  const t = useTranslations("horseEvents");
  const { data: events = [] } = useHorseEvents(horseId);
  const [showForm, setShowForm] = useState(false);

  const columns: ColumnDef<typeof events[0]>[] = [
    {
      id: "start",
      header: t("date"),
      accessorFn: (r) => new Date(r.start).toLocaleDateString(),
      sortable: true,
    },
    {
      id: "type",
      header: t("type"),
      accessorFn: (r) => t(`types.${r.eventType}`),
      sortable: true,
      filterable: true,
    },
    {
      id: "title",
      header: t("title"),
      accessorFn: (r) => r.title,
      sortable: true,
      filterable: true,
    },
    {
      id: "location",
      header: t("location"),
      accessorFn: (r) => r.location ?? "-",
    },
  ];

  return (
    <HorsePageShell horseId={horseId} title={t("title")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <SectionVisibilityPopover
          sectionKey="events"
          current={{ mode: "entities" }}
          onChange={() => {}}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t("cancel") : t("addEvent")}
        </Button>
      </div>

      {showForm && (
        <HorseEventForm
          horseId={horseId}
          onSaved={() => setShowForm(false)}
        />
      )}

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">{t("calendarView")}</TabsTrigger>
          <TabsTrigger value="table">{t("tableView")}</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <HorseEventsCalendar
            events={events}
            onDateClick={(date) => {
              setShowForm(true);
            }}
          />
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <DataTable
            columns={columns}
            data={events}
            filterPlaceholder={t("filterPlaceholder")}
            emptyMessage={t("noEvents")}
          />
        </TabsContent>
      </Tabs>
    </HorsePageShell>
  );
}
