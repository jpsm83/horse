/**
 * VeterinaryCreateContent — create-veterinary-practice form (`/veterinaries/new`).
 *
 * React Hook Form + Zod. Submits to `POST /api/v1/veterinaries` and redirects to
 * the new veterinary hub. Includes practice name, description, contact, and
 * address fields.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { TextField } from "@/components/forms/text-field.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useCreateVeterinary } from "@/hooks/queries/useVeterinary.ts";
import { useRouter } from "@/i18n/navigation.ts";

const createVeterinaryFormSchema = z.object({
  practiceName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  emergencyPhoneNumber: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.object({
    country: z.string().trim().min(1),
    city: z.string().trim().min(1),
    street: z.string().trim().min(1),
    postCode: z.string().trim().min(1),
    state: z.string().trim().optional(),
    buildingNumber: z.string().trim().optional(),
  }),
});

type CreateVeterinaryFormValues = z.infer<typeof createVeterinaryFormSchema>;

const emptyValues: CreateVeterinaryFormValues = {
  practiceName: "",
  description: "",
  email: "",
  phoneNumber: "",
  emergencyPhoneNumber: "",
  address: { country: "", city: "", street: "", postCode: "", state: "", buildingNumber: "" },
};

export function VeterinaryCreateContent() {
  const router = useRouter();
  const t = useTranslations("veterinary.create");
  const tCommon = useTranslations("common");
  const [apiError, setApiError] = useState<string | null>(null);
  const createVeterinary = useCreateVeterinary();

  const schema = useMemo(() => createVeterinaryFormSchema, []);
  const form = useForm<CreateVeterinaryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: CreateVeterinaryFormValues) {
    setApiError(null);
    try {
      const { veterinary } = await createVeterinary.mutateAsync({
        practiceName: values.practiceName,
        description: values.description,
        email: values.email,
        phoneNumber: values.phoneNumber,
        ...(values.emergencyPhoneNumber
          ? { emergencyPhoneNumber: values.emergencyPhoneNumber }
          : {}),
        address: {
          country: values.address.country,
          city: values.address.city,
          street: values.address.street,
          postCode: values.address.postCode,
          ...(values.address.state ? { state: values.address.state } : {}),
          ...(values.address.buildingNumber
            ? { buildingNumber: values.address.buildingNumber }
            : {}),
        },
      });
      router.push(`/veterinaries/${veterinary._id}`);
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : tCommon("requestFailed"));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {apiError ? (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <TextField
            control={form.control}
            name="practiceName"
            id="veterinary-practiceName"
            label={t("practiceName")}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="veterinary-description">{t("description")}</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="veterinary-description"
                  rows={4}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="email"
              id="veterinary-email"
              label={t("email")}
              type="email"
              autoComplete="email"
            />
            <TextField
              control={form.control}
              name="phoneNumber"
              id="veterinary-phone"
              label={t("phone")}
              type="tel"
              autoComplete="tel"
            />
          </div>
          <TextField
            control={form.control}
            name="emergencyPhoneNumber"
            id="veterinary-emergencyPhone"
            label={t("emergencyPhone")}
            type="tel"
          />
        </FieldGroup>

        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">{t("address")}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="address.country"
              id="veterinary-country"
              label={t("country")}
              autoComplete="country-name"
            />
            <TextField
              control={form.control}
              name="address.city"
              id="veterinary-city"
              label={t("city")}
              autoComplete="address-level2"
            />
            <TextField
              control={form.control}
              name="address.state"
              id="veterinary-state"
              label={t("state")}
              autoComplete="address-level1"
            />
            <TextField
              control={form.control}
              name="address.street"
              id="veterinary-street"
              label={t("street")}
              autoComplete="street-address"
            />
            <TextField
              control={form.control}
              name="address.buildingNumber"
              id="veterinary-buildingNumber"
              label={t("buildingNumber")}
            />
            <TextField
              control={form.control}
              name="address.postCode"
              id="veterinary-postCode"
              label={t("postCode")}
              autoComplete="postal-code"
            />
          </div>
        </fieldset>

        <Button type="submit" className="w-full sm:ms-auto sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
