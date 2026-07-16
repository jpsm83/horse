"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseEditForm } from "@/components/horses/horse-edit-form.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { queryKeys } from "@/lib/api/queryKeys";

type HorseEditPageContentProps = {
  horseId: string;
};

export function HorseEditPageContent({ horseId }: HorseEditPageContentProps) {
  const t = useTranslations("horseEdit");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const toast = useAppToast();

  const [useOwnerContact, setUseOwnerContact] = useState(true);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  async function handleSaveContact() {
    setSavingContact(true);
    try {
      const patch: Record<string, unknown> = {
        contactDisplay: {
          useOwnerContact,
        },
      };
      if (!useOwnerContact) {
        patch.contactDisplay = {
          ...patch.contactDisplay as Record<string, unknown>,
          name: contactName.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
        };
      }
      const res = await fetch(`/api/v1/horses/${horseId}/discovery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success(t("contactSaved"));
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(horseId) });
    } catch {
      toast.error(t("contactSaveFailed"));
    } finally {
      setSavingContact(false);
    }
  }

  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      {({ horse }) => (
        <>
          <HorseEditForm
            horseId={horseId}
            horse={horse}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(horseId) });
            }}
          />

          <hr className="my-6" />

          <section className="space-y-4 rounded-lg border p-4">
            <h2 className="text-lg font-semibold">{t("contactTitle")}</h2>
            <div className="flex items-center gap-2">
              <Switch
                id="useOwnerContact"
                checked={useOwnerContact}
                onCheckedChange={setUseOwnerContact}
              />
              <Label htmlFor="useOwnerContact">{t("useOwnerContact")}</Label>
            </div>

            {!useOwnerContact && (
              <div className="space-y-4 rounded-lg border p-4">
                <p className="text-sm font-medium">{t("customContact")}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">{tCommon("name")}</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">{tCommon("phone")}</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">{tCommon("email")}</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSaveContact} disabled={savingContact}>
              {savingContact ? tCommon("saving") : tCommon("save")}
            </Button>
          </section>
        </>
      )}
    </HorsePageShell>
  );
}
