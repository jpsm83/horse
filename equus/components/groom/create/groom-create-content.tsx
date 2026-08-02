/**
 * GroomCreateContent — create-groom form (`/groomers/new`).
 *
 * React Hook Form + Zod. Submits to `POST /api/v1/grooms` and redirects to the
 * new groom hub. Includes identity, contact, and address fields.
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
import { useCreateGroom } from "@/hooks/queries/useGroom.ts";
import { useRouter } from "@/i18n/navigation.ts";

const createGroomFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().max(40),
  address: z.object({
    country: z.string().trim().min(1),
    city: z.string().trim().min(1),
    street: z.string().trim().min(1),
    postCode: z.string().trim().min(1),
    state: z.string().trim().optional(),
    buildingNumber: z.string().trim().optional(),
  }),
});

type CreateGroomFormValues = z.infer<typeof createGroomFormSchema>;

const emptyValues: CreateGroomFormValues = {
  displayName: "",
  bio: "",
  email: "",
  phoneNumber: "",
  address: { country: "", city: "", street: "", postCode: "", state: "", buildingNumber: "" },
};

export function GroomCreateContent() {
  const router = useRouter();
  const t = useTranslations("groom");
  const tCommon = useTranslations("common");
  const [apiError, setApiError] = useState<string | null>(null);
  const createGroom = useCreateGroom();

  const schema = useMemo(() => createGroomFormSchema, []);
  const form = useForm<CreateGroomFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: CreateGroomFormValues) {
    setApiError(null);
    try {
      const { groom } = await createGroom.mutateAsync({
        displayName: values.displayName,
        email: values.email,
        ...(values.bio ? { bio: values.bio } : {}),
        ...(values.phoneNumber ? { phoneNumber: values.phoneNumber } : {}),
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
      router.push(`/groomers/${groom.id}`);
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : tCommon("requestFailed"));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("create.title")}</h1>
        <p className="text-muted-foreground">{t("create.description")}</p>
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
            id="groom-displayName"
            label={t("create.displayName")}
          />
          <Controller
            name="bio"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="groom-bio">{t("create.bio")}</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="groom-bio"
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
              id="groom-email"
              label={t("create.email")}
              type="email"
              autoComplete="email"
            />
            <TextField
              control={form.control}
              name="phoneNumber"
              id="groom-phone"
              label={t("create.phone")}
              type="tel"
              autoComplete="tel"
            />
          </div>
        </FieldGroup>

        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="address.country"
              id="groom-country"
              label={t("profile.country")}
              autoComplete="country-name"
            />
            <TextField
              control={form.control}
              name="address.city"
              id="groom-city"
              label={t("profile.city")}
              autoComplete="address-level2"
            />
            <TextField
              control={form.control}
              name="address.state"
              id="groom-state"
              label={t("profile.state")}
              autoComplete="address-level1"
            />
            <TextField
              control={form.control}
              name="address.street"
              id="groom-street"
              label={t("profile.street")}
              autoComplete="street-address"
            />
            <TextField
              control={form.control}
              name="address.buildingNumber"
              id="groom-buildingNumber"
              label={t("profile.buildingNumber")}
            />
            <TextField
              control={form.control}
              name="address.postCode"
              id="groom-postCode"
              label={t("profile.postCode")}
              autoComplete="postal-code"
            />
          </div>
        </FieldGroup>

        <Button type="submit" className="w-full sm:ms-auto sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? t("create.submitting") : t("create.submit")}
        </Button>
      </form>
    </div>
  );
}
