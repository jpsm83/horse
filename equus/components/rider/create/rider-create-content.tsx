/**
 * RiderCreateContent — create-rider form (`/riders/new`).
 *
 * React Hook Form + Zod. Submits to `POST /api/v1/riders` and redirects to the
 * new rider hub. Includes display name, bio, contact, and address fields.
 * A user may own at most one rider profile (create returns 409 otherwise).
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
import { useCreateRider } from "@/hooks/queries/useRider.ts";
import { useRouter } from "@/i18n/navigation.ts";

const createRiderFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().optional(),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().optional(),
  address: z
    .object({
      country: z.string().trim().min(1),
      city: z.string().trim().min(1),
      street: z.string().trim().min(1),
      postCode: z.string().trim().min(1),
      state: z.string().trim().optional(),
      buildingNumber: z.string().trim().optional(),
    })
    .optional(),
});

type CreateRiderFormValues = z.infer<typeof createRiderFormSchema>;

const emptyValues: CreateRiderFormValues = {
  displayName: "",
  bio: "",
  email: "",
  phoneNumber: "",
  address: { country: "", city: "", street: "", postCode: "", state: "", buildingNumber: "" },
};

export function RiderCreateContent() {
  const router = useRouter();
  const t = useTranslations("rider.create");
  const tProfile = useTranslations("rider.profile");
  const tCommon = useTranslations("common");
  const [apiError, setApiError] = useState<string | null>(null);
  const createRider = useCreateRider();

  const schema = useMemo(() => createRiderFormSchema, []);
  const form = useForm<CreateRiderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: CreateRiderFormValues) {
    setApiError(null);
    try {
      const { rider } = await createRider.mutateAsync({
        displayName: values.displayName,
        email: values.email,
        ...(values.bio ? { bio: values.bio } : {}),
        ...(values.phoneNumber ? { phoneNumber: values.phoneNumber } : {}),
        ...(values.address
          ? {
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
            }
          : {}),
      });
      router.push(`/riders/${rider._id}`);
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
            name="displayName"
            id="rider-displayName"
            label={t("displayName")}
          />
          <Controller
            name="bio"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="rider-bio">{t("bio")}</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="rider-bio"
                  rows={4}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="email"
              id="rider-email"
              label={t("email")}
              type="email"
              autoComplete="email"
            />
            <TextField
              control={form.control}
              name="phoneNumber"
              id="rider-phone"
              label={t("phone")}
              type="tel"
              autoComplete="tel"
            />
          </div>
        </FieldGroup>

        <fieldset className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="address.country"
              id="rider-country"
              label={tProfile("country")}
              autoComplete="country-name"
            />
            <TextField
              control={form.control}
              name="address.city"
              id="rider-city"
              label={tProfile("city")}
              autoComplete="address-level2"
            />
            <TextField
              control={form.control}
              name="address.state"
              id="rider-state"
              label={tProfile("state")}
              autoComplete="address-level1"
            />
            <TextField
              control={form.control}
              name="address.street"
              id="rider-street"
              label={tProfile("street")}
              autoComplete="street-address"
            />
            <TextField
              control={form.control}
              name="address.buildingNumber"
              id="rider-buildingNumber"
              label={tProfile("buildingNumber")}
            />
            <TextField
              control={form.control}
              name="address.postCode"
              id="rider-postCode"
              label={tProfile("postCode")}
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
