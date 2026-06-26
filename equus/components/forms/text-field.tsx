"use client";

/**
 * Reusable text input wired to React Hook Form + shadcn Field primitives.
 * Follows https://ui.shadcn.com/docs/forms/react-hook-form
 */

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  id: string;
  type?: React.ComponentProps<typeof Input>["type"];
  autoComplete?: string;
  description?: string;
};

export function TextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  id,
  type = "text",
  autoComplete,
  description,
}: TextFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...field}
            id={id}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
            className="bg-input-background hover:bg-input-background focus:bg-input-background focus-visible:bg-input-background active:bg-input-background"
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}
