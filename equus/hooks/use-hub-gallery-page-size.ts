/**
 * Responsive Hub gallery page size (6 / 9 / 12) via `useSyncExternalStore` +
 * `matchMedia` — no resize listeners or `useRef`.
 */

import { useSyncExternalStore } from "react";

const SM_MIN = "(min-width: 640px)";
const LG_MIN = "(min-width: 1024px)";

function resolvePageSize(): number {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return 12;
  }
  if (window.matchMedia(LG_MIN).matches) return 12;
  if (window.matchMedia(SM_MIN).matches) return 9;
  return 6;
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const sm = window.matchMedia(SM_MIN);
  const lg = window.matchMedia(LG_MIN);
  sm.addEventListener("change", onStoreChange);
  lg.addEventListener("change", onStoreChange);
  return () => {
    sm.removeEventListener("change", onStoreChange);
    lg.removeEventListener("change", onStoreChange);
  };
}

function getServerSnapshot(): number {
  return 12;
}

export function useHubGalleryPageSize(): number {
  return useSyncExternalStore(subscribe, resolvePageSize, getServerSnapshot);
}
