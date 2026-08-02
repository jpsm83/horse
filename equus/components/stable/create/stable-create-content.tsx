/**
 * StableCreateContent — create-stable form (`/stables/new`).
 *
 * React Hook Form + Zod. Submits to `POST /api/v1/stables` and redirects to the
 * new stable hub. Includes identity, contact, and address fields.
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
import { useCreateStable } from "@/hooks/queries/useStable.ts";
import { useRouter } from "@/i18n/navigation.ts";

const createStableFormSchema = z.object({
  tradeName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  address: z.object({
    country: z.string().trim().min(1),
    city: z.string().trim().min(1),
    street: z.string().trim().min(1),
    postCode: z.string().trim().min(1),
    state: z.string().trim().optional(),
    buildingNumber: z.string().trim().optional(),
  }),
});

type CreateStableFormValues = z.infer<typeof createStableFormSchema>;

const emptyValues: CreateStableFormValues = {
  tradeName: "",
  description: "",
  email: "",
  phoneNumber: "",
  websiteUrl: "",
  address: { country: "", city: "", street: "", postCode: "", state: "", buildingNumber: "" },
};

export function StableCreateContent() {
  const router = useRouter();
  const t = useTranslations("stable.create");
  const tCommon = useTranslations("common");
  const [apiError, setApiError] = useState<string | null>(null);
  const createStable = useCreateStable();

  const schema = useMemo(() => createStableFormSchema, []);
  const form = useForm<CreateStableFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: CreateStableFormValues) {
    setApiError(null);
    try {
      const { stable } = await createStable.mutateAsync({
        tradeName: values.tradeName,
        description: values.description,
        email: values.email,
        phoneNumber: values.phoneNumber,
        ...(values.websiteUrl ? { websiteUrl: values.websiteUrl } : {}),
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
      router.push(`/stables/${stable.id}`);
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
            name="tradeName"
            id="stable-tradeName"
            label={t("tradeName")}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="stable-description">{t("description")}</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="stable-description"
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
              id="stable-email"
              label={t("email")}
              type="email"
              autoComplete="email"
            />
            <TextField
              control={form.control}
              name="phoneNumber"
              id="stable-phone"
              label={t("phone")}
              type="tel"
              autoComplete="tel"
            />
          </div>
          <TextField
            control={form.control}
            name="websiteUrl"
            id="stable-website"
            label={t("website")}
            type="url"
          />
        </FieldGroup>

        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">{t("address")}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="address.country"
              id="stable-country"
              label={t("country")}
              autoComplete="country-name"
            />
            <TextField
              control={form.control}
              name="address.city"
              id="stable-city"
              label={t("city")}
              autoComplete="address-level2"
            />
            <TextField
              control={form.control}
              name="address.state"
              id="stable-state"
              label={t("state")}
              autoComplete="address-level1"
            />
            <TextField
              control={form.control}
              name="address.street"
              id="stable-street"
              label={t("street")}
              autoComplete="street-address"
            />
            <TextField
              control={form.control}
              name="address.buildingNumber"
              id="stable-buildingNumber"
              label={t("buildingNumber")}
            />
            <TextField
              control={form.control}
              name="address.postCode"
              id="stable-postCode"
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
