/**
 * Shared section visibility types — entity-agnostic Layer-2 modes.
 *
 * Used by SectionVisibilityPopover / SectionVisibilityControl and entity adapters
 * (HorseSectionVisibility, future StableSectionVisibility, …).
 */

import { visibilityEnums } from "@/utils/enums.ts";

export type VisibilityMode = (typeof visibilityEnums)[number];

export type SectionVisibility = {
  mode: VisibilityMode;
};
