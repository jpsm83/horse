"use client";

/**
 * Shared invite UI — search Equus users (default) or provider entities, then
 * invite by profile id or by email-only fallback when search has no hits.
 */

import { useState } from "react";
import { Loader2, Search, UserPlus, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value.ts";
import {
  useEntitySearch,
  type EntitySearchResult,
} from "@/hooks/queries/useEntitySearch.ts";
import {
  useUserSearch,
  type UserSearchResult,
} from "@/hooks/queries/useUserSearch.ts";

export type UserInviteLabels = {
  searchPlaceholder: string;
  inviteLabel: string;
  searchingLabel: string;
  searchErrorLabel: string;
  noResultsLabel: string;
  emailFallbackToggle: string;
  emailFallbackHint: string;
  emailLabel: string;
  sendEmailInvite: string;
  cancelLabel: string;
};

export type UserInviteSearchResult = UserSearchResult | EntitySearchResult;

type UserInviteSectionProps = {
  /** Default `users` (ownership/admin). Use `entities` for Connect provider search. */
  searchMode?: "users" | "entities";
  isInviting: boolean;
  onInviteUser: (id: string, searchResult: UserInviteSearchResult) => void;
  onEmailInvite: (email: string) => void;
  labels: UserInviteLabels;
};

export function UserInviteSection({
  searchMode = "users",
  isInviting,
  onInviteUser,
  onEmailInvite,
  labels,
}: UserInviteSectionProps) {
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailFallback, setShowEmailFallback] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);
  const userSearch = useUserSearch(searchMode === "users" ? debouncedQuery : "");
  const entitySearch = useEntitySearch(searchMode === "entities" ? debouncedQuery : "");

  const isSearching = searchMode === "users" ? userSearch.isLoading : entitySearch.isLoading;
  const searchError = searchMode === "users" ? userSearch.error : entitySearch.error;
  const results: UserInviteSearchResult[] =
    searchMode === "users" ? (userSearch.data ?? []) : (entitySearch.data ?? []);

  function handleEmailInvite() {
    if (!email.trim()) return;
    onEmailInvite(email.trim());
    setEmail("");
    setShowEmailFallback(false);
  }

  function resultSubtitle(result: UserInviteSearchResult): string {
    if ("entityLabel" in result) {
      return `${result.entityLabel} · ${result.email}`;
    }
    const handle = result.username ? `@${result.username} · ` : "";
    return `${handle}${result.email}`;
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
                <p className="text-xs text-muted-foreground">{resultSubtitle(result)}</p>
              </div>
              <Button
                size="sm"
                onClick={() => onInviteUser(result.id, result)}
                disabled={isInviting}
              >
                <UserPlus className="mr-1 h-3 w-3" />
                {labels.inviteLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!isSearching &&
        query.trim().length >= 2 &&
        results.length === 0 &&
        !searchError &&
        !showEmailFallback && (
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
          <Input
            placeholder={labels.emailLabel}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("");
                setShowEmailFallback(false);
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
