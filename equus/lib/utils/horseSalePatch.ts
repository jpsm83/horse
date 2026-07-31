/**
 * Map horse sale fields ↔ form values and build PATCH payloads from dirty fields.
 */

import type { OwnerHorseSummary } from "@/lib/services/horseService.ts";
import type { SaleFormValues } from "@/lib/validations/horseForms.ts";
import {
  buildDatePatch,
  buildNumberPatch,
  buildOptionalStringPatch,
  collectPatch,
} from "@/lib/utils/horseProfilePatch.ts";

type DirtyFields = Record<string, boolean | object | undefined>;

export function emptySaleFormValues(): SaleFormValues {
  return {
    saleStatus: "not_for_sale",
    estimatedValue: "",
    valueCurrency: "USD",
    askingPrice: "",
    acquisitionDate: "",
    profileVisibility: "public",
  };
}

export function toSaleFormValues(horse: OwnerHorseSummary): SaleFormValues {
  return {
    saleStatus: (horse.saleStatus === "for_sale" ? "for_sale" : "not_for_sale") as SaleFormValues["saleStatus"],
    estimatedValue: horse.estimatedValue != null ? String(horse.estimatedValue) : "",
    valueCurrency: horse.valueCurrency ?? "USD",
    askingPrice: horse.askingPrice != null ? String(horse.askingPrice) : "",
    acquisitionDate: horse.acquisitionDate ? horse.acquisitionDate.slice(0, 10) : "",
    profileVisibility: (horse.profileVisibility ?? "public") as SaleFormValues["profileVisibility"],
  };
}

export function buildSaleSavePatch(
  values: SaleFormValues,
  dirty: DirtyFields,
): Record<string, unknown> {
  return collectPatch({
    saleStatus: dirty.saleStatus ? values.saleStatus : undefined,
    estimatedValue: buildNumberPatch(dirty, "estimatedValue", values.estimatedValue),
    valueCurrency: buildOptionalStringPatch(dirty, "valueCurrency", values.valueCurrency),
    askingPrice: buildNumberPatch(dirty, "askingPrice", values.askingPrice),
    acquisitionDate: buildDatePatch(dirty, "acquisitionDate", values.acquisitionDate),
  });
}

/** Dirty-only Layer-1 discovery patch (`PATCH …/discovery`). Hub sections autosave separately. */
export function buildVisibilitySavePatch(
  values: SaleFormValues,
  dirty: DirtyFields,
): Record<string, unknown> {
  return collectPatch({
    profileVisibility: dirty.profileVisibility ? values.profileVisibility : undefined,
  });
}
