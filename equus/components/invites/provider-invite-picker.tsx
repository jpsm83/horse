/**
 * Reusable filterable provider search + invite control for horse and host contexts.
 */

"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import {
  searchDiscoverProviders,
  type DiscoverProviderCard,
  type DiscoverProviderType,
} from "@/lib/api/discoverClient.ts";
import {
  createRelationshipInvite,
  RelationshipClientError,
} from "@/lib/api/relationshipClient.ts";
import { businessRoleTypeEnums } from "@/utils/enums.ts";

const ENTITY_OWNED_TYPES = new Set<string>(businessRoleTypeEnums);

export type ProviderInvitePickerProps = {
  inviteContext: "horse" | "host";
  targetId: string;
  relationshipType: DiscoverProviderType;
  disabled?: boolean;
  isPending?: boolean;
  onInvited?: () => void;
};

export function ProviderInvitePicker({
  inviteContext,
  targetId,
  relationshipType,
  disabled = false,
  isPending = false,
  onInvited,
}: ProviderInvitePickerProps) {
  const t = useTranslations("invites.horseProviders");
  const tStatus = useTranslations("status");
  const toast = useAppToast();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<DiscoverProviderCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState("");
  const [invitedName, setInvitedName] = useState("");

  const supportsEmailInvite = inviteContext === "horse" && !ENTITY_OWNED_TYPES.has(relationshipType);
  const isDisabled = disabled || isPending || isSubmitting;

  const runSearch = useCallback(
    async (searchQuery: string) => {
      setIsSearching(true);
      try {
        const results = await searchDiscoverProviders({
          type: relationshipType,
          q: searchQuery,
          limit: 20,
          scope: inviteContext,
        });
        setProviders(results);
      } catch {
        setProviders([]);
      } finally {
        setIsSearching(false);
      }
    },
    [inviteContext, relationshipType],
  );

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [open, query, runSearch]);

  async function handleInviteByProfile(provider: DiscoverProviderCard) {
    if (inviteContext !== "horse") return;

    setIsSubmitting(true);
    try {
      await createRelationshipInvite({
        horseId: targetId,
        relationshipType,
        receiverAccountId: provider.id,
      });
      toast.success(t("invited"));
      setOpen(false);
      onInvited?.();
    } catch (err) {
      const message =
        err instanceof RelationshipClientError ? err.message : tStatus("requestFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleInviteByEmail() {
    if (!supportsEmailInvite || !invitedEmail.trim()) return;

    setIsSubmitting(true);
    try {
      await createRelationshipInvite({
        horseId: targetId,
        relationshipType,
        invitedEmail: invitedEmail.trim(),
        invitedName: invitedName.trim() || undefined,
      });
      toast.success(t("invited"));
      setInvitedEmail("");
      setInvitedName("");
      setShowEmailFallback(false);
      onInvited?.();
    } catch (err) {
      const message =
        err instanceof RelationshipClientError ? err.message : tStatus("requestFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPending) {
    return (
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{t("pending")}</p>
    );
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={isDisabled}
              className="w-full justify-between font-normal"
            />
          }
        >
          {t("searchPlaceholder")}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--anchor-width)] min-w-[280px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t("filterPlaceholder")}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isSearching ? t("searching") : t("noResults")}
              </CommandEmpty>
              {providers.map((provider) => (
                <CommandItem
                  key={provider.id}
                  value={provider.id}
                  onSelect={() => void handleInviteByProfile(provider)}
                >
                  <div className="flex flex-col">
                    <span>{provider.label}</span>
                    {provider.subtitle ? (
                      <span className="text-xs text-muted-foreground">{provider.subtitle}</span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {supportsEmailInvite ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-muted-foreground"
            disabled={isDisabled}
            onClick={() => setShowEmailFallback((value) => !value)}
          >
            {t("emailFallbackToggle")}
          </Button>

          {showEmailFallback ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="space-y-1">
                <Label htmlFor={`invite-email-${relationshipType}`}>{t("emailLabel")}</Label>
                <Input
                  id={`invite-email-${relationshipType}`}
                  type="email"
                  value={invitedEmail}
                  onChange={(event) => setInvitedEmail(event.target.value)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`invite-name-${relationshipType}`}>{t("nameLabel")}</Label>
                <Input
                  id={`invite-name-${relationshipType}`}
                  value={invitedName}
                  onChange={(event) => setInvitedName(event.target.value)}
                  disabled={isDisabled}
                />
              </div>
              <Button
                type="button"
                size="sm"
                disabled={isDisabled || !invitedEmail.trim()}
                onClick={() => void handleInviteByEmail()}
              >
                {t("sendEmailInvite")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("entityOwnedHint")}</p>
      )}
    </div>
  );
}
