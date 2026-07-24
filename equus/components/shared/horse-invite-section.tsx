"use client";

import { useState } from "react";
import { Loader2, Search, UserPlus, Mail, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value.ts";
import { useHorseSearch } from "@/hooks/queries/useHorseSearch.ts";

export type HorseInviteLabels = {
  searchPlaceholder: string;
  inviteLabel: string;
  connectedLabel: string;
  disconnectLabel: string;
  searchingLabel: string;
  searchErrorLabel: string;
  noResultsLabel: string;
  emailFallbackToggle: string;
  emailFallbackHint: string;
  emailLabel: string;
  horseNameLabel: string;
  sendInviteLabel: string;
  cancelLabel: string;
};

type HorseInviteSectionProps = {
  currentHorseId?: string;
  currentHorseName?: string;
  isConnecting: boolean;
  onConnect: (parentHorseId: string, parentHorseName: string, ownerId: string) => void;
  onInviteOwner: (email: string, horseName: string) => void;
  onDisconnect: () => void;
  labels: HorseInviteLabels;
};

export function HorseInviteSection({
  currentHorseId,
  currentHorseName,
  isConnecting,
  onConnect,
  onInviteOwner,
  onDisconnect,
  labels,
}: HorseInviteSectionProps) {
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [horseName, setHorseName] = useState("");
  const [showEmailFallback, setShowEmailFallback] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results = [], isLoading: isSearching, error: searchError } = useHorseSearch(debouncedQuery);

  function resetInviteForm() {
    setEmail("");
    setHorseName("");
    setShowEmailFallback(false);
  }

  function handleEmailInvite() {
    if (!email.trim() || !horseName.trim()) return;
    onInviteOwner(email.trim(), horseName.trim());
    resetInviteForm();
  }

  if (currentHorseId && currentHorseName) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success" />
          <p className="text-sm font-medium">{currentHorseName}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onDisconnect} disabled={isConnecting}>
          <X className="mr-1 h-3 w-3" />
          {labels.disconnectLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={labels.searchPlaceholder}
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
                  {result.registeredName ? `${result.registeredName} · ` : ""}
                  {result.ownerEmail}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onConnect(result.id, result.name, result.ownerId)}
                disabled={isConnecting}
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
          <Button variant="outline" size="sm" onClick={() => setShowEmailFallback(true)}>
            <Mail className="mr-1 h-3 w-3" />
            {labels.emailFallbackToggle}
          </Button>
        </div>
      )}

      {showEmailFallback && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{labels.emailFallbackHint}</p>
          <div className="flex gap-4">
            <Input
              placeholder={labels.horseNameLabel}
              value={horseName}
              onChange={(e) => setHorseName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder={labels.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetInviteForm}>
              <X className="mr-1 h-3 w-3" />
              {labels.cancelLabel}
            </Button>
            <Button
              size="sm"
              onClick={handleEmailInvite}
              disabled={!email.trim() || !horseName.trim() || isConnecting}
            >
              {labels.sendInviteLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
