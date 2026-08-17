"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog.tsx";
import { useRouter } from "@/i18n/navigation.ts";

type UnsavedChangesContextValue = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  isSaving: boolean;
  setSaving: (saving: boolean) => void;
  requestNavigation: (href: string) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);
const DiscardHandlerContext = createContext<
  ((handler: (() => void) | undefined) => void) | null
>(null);

type UnsavedChangesProviderProps = {
  children: ReactNode;
  dialogTitle: string;
  dialogDescription: string;
  stayLabel: string;
  leaveLabel: string;
  /** Called when the user confirms leave without saving (before navigation). */
  onDiscard?: () => void;
};

export function UnsavedChangesProvider({
  children,
  dialogTitle,
  dialogDescription,
  stayLabel,
  leaveLabel,
  onDiscard,
}: UnsavedChangesProviderProps) {
  const router = useRouter();
  const [isDirty, setDirty] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [discardHandler, setDiscardHandlerState] = useState<
    (() => void) | undefined
  >(() => onDiscard);

  useEffect(() => {
    setDiscardHandlerState(() => onDiscard);
  }, [onDiscard]);

  useEffect(() => {
    if (!isDirty) return;
    // Justified imperative API: `beforeunload` has no declarative React equivalent.
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const requestNavigation = useCallback(
    (href: string) => {
      if (!isDirty || isSaving) {
        router.push(href);
        return;
      }
      setPendingHref(href);
      setDialogOpen(true);
    },
    [isDirty, isSaving, router],
  );

  const confirmLeave = useCallback(() => {
    const href = pendingHref;
    setPendingHref(null);
    setDialogOpen(false);
    discardHandler?.();
    setDirty(false);
    if (href) router.push(href);
  }, [discardHandler, pendingHref, router]);

  // Lets a nested form (e.g. preferences) override the discard handler when the
  // provider lives at the layout level (no per-page onDiscard prop).
  const setDiscardHandler = useCallback(
    (handler: (() => void) | undefined) => {
      setDiscardHandlerState(() => handler);
    },
    [],
  );

  const value = useMemo(
    () => ({ isDirty, setDirty, isSaving, setSaving, requestNavigation }),
    [isDirty, isSaving, requestNavigation],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      <DiscardHandlerContext.Provider value={setDiscardHandler}>
        {children}
        <ConfirmActionDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setPendingHref(null);
          }}
          title={dialogTitle}
          description={dialogDescription}
          cancelLabel={stayLabel}
          confirmLabel={leaveLabel}
          variant="destructive"
          onConfirm={confirmLeave}
        />
      </DiscardHandlerContext.Provider>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges(): UnsavedChangesContextValue {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    throw new Error("useUnsavedChanges must be used within UnsavedChangesProvider");
  }
  return ctx;
}

export function useUnsavedChangesOptional(): UnsavedChangesContextValue | null {
  return useContext(UnsavedChangesContext);
}

/** Register/override the discard handler when the provider sits above the page. */
export function useSetUnsavedDiscardHandler() {
  return useContext(DiscardHandlerContext);
}
