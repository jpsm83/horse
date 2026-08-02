/**
 * TrainerCreateContent — create-trainer-profile form (`/trainers/new`).
 *
 * React Hook Form + Zod. Submits to `POST /api/v1/trainers` and redirects to the
 * new trainer hub. Includes display name, bio, contact, and address fields.
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
import { useCreateTrainer } from "@/hooks/queries/useTrainer.ts";
import { useRouter } from "@/i18n/navigation.ts";

const createTrainerFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().min(1).max(2000),
  email: z.string().trim().min(1).email(),
  phoneNumber: z.string().trim().min(1).max(40),
  address: z.object({
    country: z.string().trim().min(1),
    city: z.string().trim().min(1),
    street: z.string().trim().min(1),
    postCode: z.string().trim().min(1),
    state: z.string().trim().optional(),
    buildingNumber: z.string().trim().optional(),
  }),
});

type CreateTrainerFormValues = z.infer<typeof createTrainerFormSchema>;

const emptyValues: CreateTrainerFormValues = {
  displayName: "",
  bio: "",
  email: "",
  phoneNumber: "",
  address: { country: "", city: "", street: "", postCode: "", state: "", buildingNumber: "" },
};

export function TrainerCreateContent() {
  const router = useRouter();
  const t = useTranslations("trainer.create");
  const tCommon = useTranslations("common");
  const [apiError, setApiError] = useState<string | null>(null);
  const createTrainer = useCreateTrainer();

  const schema = useMemo(() => createTrainerFormSchema, []);
  const form = useForm<CreateTrainerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: CreateTrainerFormValues) {
    setApiError(null);
    try {
      const { trainer } = await createTrainer.mutateAsync({
        displayName: values.displayName,
        bio: values.bio,
        email: values.email,
        phoneNumber: values.phoneNumber,
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
      router.push(`/trainers/${trainer._id}`);
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
            id="trainer-displayName"
            label={t("displayName")}
          />
          <Controller
            name="bio"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="trainer-bio">{t("bio")}</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="trainer-bio"
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
              id="trainer-email"
              label={t("email")}
              type="email"
              autoComplete="email"
            />
            <TextField
              control={form.control}
              name="phoneNumber"
              id="trainer-phone"
              label={t("phone")}
              type="tel"
              autoComplete="tel"
            />
          </div>
        </FieldGroup>

        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">{t("address")}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="address.country"
              id="trainer-country"
              label={t("country")}
              autoComplete="country-name"
            />
            <TextField
              control={form.control}
              name="address.city"
              id="trainer-city"
              label={t("city")}
              autoComplete="address-level2"
            />
            <TextField
              control={form.control}
              name="address.state"
              id="trainer-state"
              label={t("state")}
              autoComplete="address-level1"
            />
            <TextField
              control={form.control}
              name="address.street"
              id="trainer-street"
              label={t("street")}
              autoComplete="street-address"
            />
            <TextField
              control={form.control}
              name="address.buildingNumber"
              id="trainer-buildingNumber"
              label={t("buildingNumber")}
            />
            <TextField
              control={form.control}
              name="address.postCode"
              id="trainer-postCode"
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
