"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const pendingHrefRef = useRef<string | null>(null);
  const onDiscardRef = useRef(onDiscard);
  onDiscardRef.current = onDiscard;

  useEffect(() => {
    if (!isDirty) return;
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
      pendingHrefRef.current = href;
      setDialogOpen(true);
    },
    [isDirty, isSaving, router],
  );

  const confirmLeave = useCallback(() => {
    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    setDialogOpen(false);
    onDiscardRef.current?.();
    setDirty(false);
    if (href) router.push(href);
  }, [router]);

  const value = useMemo(
    () => ({ isDirty, setDirty, isSaving, setSaving, requestNavigation }),
    [isDirty, isSaving, requestNavigation],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <ConfirmActionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) pendingHrefRef.current = null;
        }}
        title={dialogTitle}
        description={dialogDescription}
        cancelLabel={stayLabel}
        confirmLabel={leaveLabel}
        variant="destructive"
        onConfirm={confirmLeave}
      />
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
