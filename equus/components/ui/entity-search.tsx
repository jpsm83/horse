/**
 * EntitySearch — unified search across all entity types + users.
 *
 * Used by the Connect tab's invite section. Searches by name, email, or username.
 * Only returns registered Equus users with claimed entity profiles.
 *
 * Business rule: Non-users cannot be returned as search results.
 * Email invitations create pending relationships that activate upon signup.
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Search, UserPlus, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EntitySearchResult = {
  id: string;
  name: string;
  email: string;
  entityType: string;
  entityLabel: string;
};

type EntitySearchProps = {
  horseId: string;
  onInvite: (result: EntitySearchResult) => void;
  onEmailInvite: (email: string, name: string | undefined, entityType: string) => void;
};

export function EntitySearch({ horseId, onInvite, onEmailInvite }: EntitySearchProps) {
  const t = useTranslations("horseConnect");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailType, setEmailType] = useState("stable");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setShowEmailFallback(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/v1/search/entities?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
      setShowEmailFallback(false);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setShowEmailFallback(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function handleEmailFallbackToggle() {
    setShowEmailFallback(true);
    setResults([]);
  }

  function handleEmailInvite() {
    if (!email.trim()) return;
    onEmailInvite(email.trim(), name.trim() || undefined, emailType);
    setEmail("");
    setName("");
    setShowEmailFallback(false);
    setQuery("");
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("searching")}
        </div>
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
              <Button size="sm" onClick={() => onInvite(result)}>
                <UserPlus className="mr-1 h-3 w-3" />
                {t("invite")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!isSearching && query.trim().length >= 2 && results.length === 0 && !showEmailFallback && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("noResults")}</p>
          <Button variant="outline" size="sm" onClick={handleEmailFallbackToggle}>
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
            <select
              value={emailType}
              onChange={(e) => setEmailType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {["stable", "veterinary", "trainer", "groom", "farrier", "rider", "breeder", "ridingClub", "transport", "coach"].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={handleEmailInvite} disabled={!email.trim()}>
            {t("sendEmailInvite")}
          </Button>
        </div>
      )}
    </div>
  );
}
