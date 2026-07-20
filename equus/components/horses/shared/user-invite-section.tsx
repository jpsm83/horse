"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EntitySearchResult } from "@/hooks/queries/useEntitySearch.ts";

export type UserInviteLabels = {
  searchPlaceholder: string;
  inviteLabel: string;
  searchingLabel: string;
  searchErrorLabel: string;
  noResultsLabel: string;
  emailFallbackToggle: string;
  emailFallbackHint: string;
  emailLabel: string;
  nameLabel: string;
  sendEmailInvite: string;
  cancelLabel: string;
};

type UserInviteSectionProps = {
  query: string;
  onQueryChange: (query: string) => void;
  results: EntitySearchResult[];
  isSearching: boolean;
  searchError: Error | null;
  onInviteUser: (userId: string) => void;
  onEmailInvite: (email: string, name?: string) => void;
  isInviting: boolean;
  showEmailFallback: boolean;
  onShowEmailFallback: (show: boolean) => void;
  labels: UserInviteLabels;
};

export function UserInviteSection({
  query,
  onQueryChange,
  results,
  isSearching,
  searchError,
  onInviteUser,
  onEmailInvite,
  isInviting,
  showEmailFallback,
  onShowEmailFallback,
  labels,
}: UserInviteSectionProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setEmail("");
    setName("");
  }, [showEmailFallback]);

  function handleEmailInvite() {
    if (!email.trim()) return;
    onEmailInvite(email.trim(), name.trim() || undefined);
    setEmail("");
    setName("");
    onShowEmailFallback(false);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={labels.searchPlaceholder}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            onShowEmailFallback(false);
          }}
          className="pl-9"
        />
      </div>

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {labels.searchingLabel}
        </div>
      )}

      {searchError && (
        <p className="text-sm text-destructive">{labels.searchErrorLabel}</p>
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
                onClick={() => onInviteUser(result.id)}
                disabled={isInviting}
              >
                <UserPlus className="mr-1 h-3 w-3" />
                {labels.inviteLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!isSearching && query.trim().length >= 2 && results.length === 0 && !searchError && !showEmailFallback && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{labels.noResultsLabel}</p>
          <Button variant="outline" size="sm" onClick={() => onShowEmailFallback(true)}>
            <Mail className="mr-1 h-3 w-3" />
            {labels.emailFallbackToggle}
          </Button>
        </div>
      )}

      {showEmailFallback && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{labels.emailFallbackHint}</p>
          <div className="space-y-2">
            <Input
              placeholder={labels.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder={labels.nameLabel}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("");
                setName("");
                onShowEmailFallback(false);
              }}
            >
              <X className="mr-1 h-3 w-3" />
              {labels.cancelLabel}
            </Button>
            <Button
              size="sm"
              onClick={handleEmailInvite}
              disabled={!email.trim() || isInviting}
            >
              {labels.sendEmailInvite}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
