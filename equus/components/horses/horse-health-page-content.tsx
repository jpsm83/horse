"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
import { SectionVisibilityPopover } from "@/components/shared/section-visibility-popover.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHorseHealthRecords, useCreateHealthRecord } from "@/hooks/queries/useHorseHealth.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { PublicHealthRecord } from "@/lib/services/horseHealthService";

type Props = { horseId: string };

function HorseHealthRecordForm({ horseId, onSaved }: { horseId: string; onSaved: () => void }) {
  const t = useTranslations("horseMedical");
  const toast = useAppToast();
  const createMutation = useCreateHealthRecord(horseId);
  const [recordType, setRecordType] = useState("exam");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    createMutation.mutate(
      { recordType, title: title.trim(), date, performedBy: performedBy.trim() || undefined, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("recordCreated"));
          onSaved();
          setTitle("");
          setDate("");
          setPerformedBy("");
          setNotes("");
        },
        onError: () => toast.error(t("recordError")),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recordType">{t("type")}</Label>
          <select
            id="recordType"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {["vaccination", "exam", "medication", "injury", "allergy", "other"].map((type) => (
              <option key={type} value={type}>{t(`types.${type}`)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="healthDate">{t("date")}</Label>
          <Input id="healthDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="healthTitle">{t("title")}</Label>
        <Input id="healthTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="performedBy">{t("performedBy")}</Label>
        <Input id="performedBy" value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="healthNotes">{t("notes")}</Label>
        <textarea
          id="healthNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
        />
      </div>
      <Button type="submit" disabled={createMutation.isPending || !title.trim() || !date}>
        {createMutation.isPending ? t("saving") : t("saveRecord")}
      </Button>
    </form>
  );
}

export function HorseHealthPageContent({ horseId }: Props) {
  const t = useTranslations("horseMedical");
  const { data: records = [] } = useHorseHealthRecords(horseId);
  const [showForm, setShowForm] = useState(false);

  const columns: DataTableColumnDef<PublicHealthRecord>[] = [
    { id: "date", accessorFn: (r) => new Date(r.date).toLocaleDateString(), header: t("date"), enableSorting: true },
    { id: "type", accessorFn: (r) => t(`types.${r.recordType}`), header: t("type"), enableSorting: true, filterType: "input" },
    { id: "title", accessorKey: "title", header: t("title"), enableSorting: true, filterType: "input" },
    { id: "performedBy", accessorFn: (r) => r.performedBy ?? "-", header: t("performedBy") },
  ];

  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("records")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <SectionVisibilityPopover
          sectionKey="medical"
          current={{ mode: "owner" }}
          onChange={() => {}}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t("cancel") : t("addRecord")}
        </Button>
      </div>

      {showForm && (
        <HorseHealthRecordForm
          horseId={horseId}
          onSaved={() => setShowForm(false)}
        />
      )}

      <DataTable
        columns={columns}
        data={records}
        enableSorting
        enableFiltering
        emptyStateMessage={t("noRecords")}
      />
    </HorsePageShell>
  );
}
