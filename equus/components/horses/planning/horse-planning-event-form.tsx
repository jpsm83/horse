"use client";

/**
 * HorsePlanningEventForm — owner-team personal events on the horse calendar.
 * Entity-sourced care/feed/stable events are created on the provider entity (not built yet).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  planningEventFormSchema,
  planningEventTypeEnums,
  type PlanningEventFormValues,
} from "@/lib/validations/horsePlanningForms.ts";
import { useCreatePlanningEvent } from "@/hooks/queries/useHorsePlanning.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type HorsePlanningEventFormProps = {
  horseId: string;
  defaultDate: string;
  onSaved: () => void;
};

export function HorsePlanningEventForm({
  horseId,
  defaultDate,
  onSaved,
}: HorsePlanningEventFormProps) {
  const t = useTranslations("horsePlanning");
  const toast = useAppToast();
  const createMutation = useCreatePlanningEvent(horseId);

  const schema = useMemo(
    () =>
      planningEventFormSchema({
        titleRequired: t("eventTitleRequired"),
        startDateRequired: t("startDateRequired"),
      }),
    [t],
  );

  const form = useForm<PlanningEventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventType: "appointment",
      title: "",
      startDate: defaultDate,
      endDate: "",
      location: "",
    },
  });

  async function onSubmit(values: PlanningEventFormValues) {
    try {
      await createMutation.mutateAsync({
        eventType: values.eventType,
        title: values.title.trim(),
        startDate: values.startDate,
        endDate: values.endDate.trim() || undefined,
        location: values.location.trim() || undefined,
      });
      toast.success(t("eventCreated"));
      onSaved();
    } catch {
      toast.error(t("eventError"));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="ev-type">{t("type")}</Label>
        <Controller
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => field.onChange(value ?? "appointment")}>
              <SelectTrigger id="ev-type" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" alignItemWithTrigger={false} className="max-h-60">
                {planningEventTypeEnums.map((et) => (
                  <SelectItem key={et} value={et}>
                    {t("types." + et)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-title">{t("eventTitle")}</Label>
        <Input id="ev-title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-start">{t("startDate")}</Label>
        <Input id="ev-start" type="datetime-local" {...form.register("startDate")} />
        {form.formState.errors.startDate && (
          <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-end">{t("endDate")}</Label>
        <Input id="ev-end" type="datetime-local" {...form.register("endDate")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-loc">{t("location")}</Label>
        <Input id="ev-loc" {...form.register("location")} />
      </div>

      <Button
        type="submit"
        disabled={createMutation.isPending || form.formState.isSubmitting}
        className="w-full"
      >
        {createMutation.isPending ? t("saving") : t("saveEvent")}
      </Button>
    </form>
  );
}
