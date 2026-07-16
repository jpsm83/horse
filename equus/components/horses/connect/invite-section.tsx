"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search, UserPlus, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value.ts";
import type { DiscoverProviderType } from "@/lib/api/discoverClient.ts";
import { useEntitySearch } from "@/hooks/queries/useEntitySearch.ts";
import { useCreateRelationshipInvite } from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type InviteSectionProps = {
  horseId: string;
};

export function InviteSection({ horseId }: InviteSectionProps) {
  const t = useTranslations("horseConnect");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const [query, setQuery] = useState("");
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results = [], isLoading: isSearching, error: searchError } = useEntitySearch(debouncedQuery);
  const inviteMutation = useCreateRelationshipInvite();

  function handleInvite(receiverAccountId: string, relationshipType: DiscoverProviderType) {
    inviteMutation.mutate(
      { horseId, receiverAccountId, relationshipType },
      {
        onSuccess: () => toast.success(t("invitationSent")),
        onError: () => toast.error(t("invitationCancelled")),
      },
    );
  }

  function handleEmailInvite() {
    if (!email.trim()) return;
    inviteMutation.mutate(
      { horseId, invitedEmail: email.trim(), invitedName: name.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("invitationSent"));
          setEmail("");
          setName("");
          setShowEmailFallback(false);
          setQuery("");
        },
        onError: () => toast.error(t("invitationCancelled")),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowEmailFallback(false);
          }}
          className="pl-9"
        />
      </div>

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("searching")}
        </div>
      )}

      {searchError && (
        <p className="text-sm text-destructive">{t("searchError")}</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((result) => (
            <li
              key={result.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{result.name}</p>
                <p className="text-xs text-muted-foreground">
                  {result.entityLabel} · {result.email}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleInvite(result.id, result.entityType as DiscoverProviderType)}
                disabled={inviteMutation.isPending}
              >
                <UserPlus className="mr-1 h-3 w-3" />
                {t("invite")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!isSearching && query.trim().length >= 2 && results.length === 0 && !searchError && !showEmailFallback && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("noResults")}</p>
          <Button variant="outline" size="sm" onClick={() => setShowEmailFallback(true)}>
            <Mail className="mr-1 h-3 w-3" />
            {t("emailFallbackToggle")}
          </Button>
        </div>
      )}

      {showEmailFallback && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t("emailFallbackHint")}</p>
          <div className="space-y-2">
            <Input
              placeholder={t("emailLabel")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder={t("nameLabel")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowEmailFallback(false);
                setEmail("");
                setName("");
              }}
            >
              <X className="mr-1 h-3 w-3" />
              {tCommon("cancel")}
            </Button>
            <Button
              size="sm"
              onClick={handleEmailInvite}
              disabled={!email.trim() || inviteMutation.isPending}
            >
              {t("sendEmailInvite")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
