/**
 * Base UI / Radix SelectItem cannot use "" as `value`.
 * Form fields still use "" for “no selection”; map through a translated sentinel.
 */

export function toSelectValue(
  value: string,
  options: { value: string }[],
  emptySentinel: string,
): string | null {
  if (value === "") {
    const hasEmptyOption = options.some((option) => option.value === "");
    return hasEmptyOption ? emptySentinel : null;
  }
  return value;
}

export function fromSelectValue(
  value: string | null,
  emptySentinel: string,
): string {
  if (value === null || value === emptySentinel) return "";
  return value;
}

export function selectItemValue(
  optionValue: string,
  emptySentinel: string,
): string {
  return optionValue === "" ? emptySentinel : optionValue;
}
