# Plan 1: Connect Tab + Tab Restructuring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Connect tab with unified provider search + connections table; remove Relations and Discovery tabs; rename Sale to Admin; make Hub a view-only public feed.

**Architecture:** Single-page application using Next.js App Router, React 19, TanStack Query, shadcn/ui. All horse sub-pages use `HorsePageShell` wrapper with `EntityTabs` header navigation.

**Tech Stack:** Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui, TanStack Query v5, next-intl

## Global Constraints

- Business rule: Entities MUST be Equus users to interact with horses via the app. Email invites create pending relationships that activate upon signup + entity profile creation.
- Horses have NO restriction — can have external relationships, but only get Hub features without in-app connections.
- No hard deletes — soft deactivation only
- All client data fetching uses TanStack Query hooks in `hooks/queries/`
- i18n via next-intl, all user-facing strings in `messages/en.json` and `messages/es.json`
- Use `@/` path alias for imports
- Use `Link`, `useRouter`, `redirect` from `@/i18n/navigation` (NOT `next/link`)
- shadcn components only in `components/ui/` — no hand-written copies
- All new files must have file header comments per AGENTS.md §11
- All documentation must reflect the core business rule (entities must be users)

---

## File Structure

### New files to create:
- `components/ui/data-table.tsx` — Reusable DataTable wrapping shadcn Table + sort/filter/pagination
- `components/ui/section-visibility-popover.tsx` — Reusable visibility popover for section headers
- `components/horses/horse-connect-page-content.tsx` — Connect tab main component
- `app/[locale]/horses/[horseId]/connect/page.tsx` — Connect route page
- `documentation/horseTabs.md` — Documentation of new tab structure and business rules

### Files to modify:
- `lib/navigation/horseTabs.ts` — Add Connect, remove Relations/Discovery, rename Sale→Admin
- `components/horses/horse-hub-page-content.tsx` — Remove Connect providers, simplify to dashboard (basic info + pedigree + ownership summary)
- `components/horses/horse-page-shell.tsx` — Adjust for new tab set
- `components/horses/horse-sale-page-content.tsx` — Rename to Admin, add ownership management section (moved from Hub)
- `app/[locale]/horses/[horseId]/sale/page.tsx` — Update metadata label to "Admin"
- `components/horses/horse-edit-page-content.tsx` — Add contact display section (moved from Discovery)
- `messages/en.json` — Add Connect keys, Admin keys; update Discovery removal
- `messages/es.json` — Same changes as en.json
- `AGENTS.md` — Add business rule to project overview

### Files to delete:
- `app/[locale]/horses/[horseId]/discovery/` (directory + all contents)
- `app/[locale]/horses/[horseId]/relations/` (directory + all contents)
- `components/horses/horse-discovery-page-content.tsx`
- `components/horses/horse-discovery-form.tsx`
- `components/horses/horse-relations-page-content.tsx`

---

### Task 1: Create reusable DataTable component

**Files:**
- Create: `components/ui/data-table.tsx`
- Reference: `components/ui/table` (existing shadcn table)

**Interfaces:**
- Consumes: shadcn `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`
- Produces: `DataTable<T>` generic component with sort, filter, pagination

- [ ] **Step 1: Create DataTable component**

```tsx
/**
 * Reusable DataTable component wrapping shadcn Table.
 * Supports sortable columns, filter toolbar, pagination, row actions.
 *
 * Used by: Connect tab (connections), Admin tab (ownership history),
 * Medical tab (health records), History tab (audit log).
 */

"use client";

import { useState, useMemo, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
  id: string;
  header: string;
  accessorFn: (row: T) => string | number | ReactNode;
  sortable?: boolean;
  filterable?: boolean;
};

export type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  pageSize?: number;
  filterPlaceholder?: string;
  emptyMessage?: string;
  onRowAction?: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  data,
  pageSize = 10,
  filterPlaceholder = "Filter...",
  emptyMessage = "No results.",
  onRowAction,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  const filterableColumns = useMemo(
    () => columns.filter((c) => c.filterable),
    [columns],
  );

  const filtered = useMemo(() => {
    if (!filter.trim()) return data;
    const lower = filter.toLowerCase();
    return data.filter((row) =>
      filterableColumns.some((col) => {
        const val = col.accessorFn(row);
        return String(val).toLowerCase().includes(lower);
      }),
    );
  }, [data, filter, filterableColumns]);

  const sorted = useMemo(() => {
    if (!sortColumn) return filtered;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = col.accessorFn(a);
      const bVal = col.accessorFn(b);
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortColumn, sortDirection, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  function handleSort(columnId: string) {
    if (sortColumn === columnId) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {filterableColumns.length > 0 && (
        <Input
          placeholder={filterPlaceholder}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(col.sortable && "cursor-pointer select-none")}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <>
                        {sortColumn === col.id ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </>
                    )}
                  </span>
                </TableHead>
              ))}
              {onRowAction && <TableHead className="w-0" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onRowAction ? 1 : 0)} className="text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>{col.accessorFn(row)}</TableCell>
                  ))}
                  {onRowAction && (
                    <TableCell className="text-right">{onRowAction(row)}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {safePage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ui/data-table.tsx
git commit -m "feat: add reusable DataTable component with sort/filter/pagination"
```

---

### Task 2: Create SectionVisibilityPopover component

**Files:**
- Create: `components/ui/section-visibility-popover.tsx`
- Reference: shadcn Popover, Button, Badge

**Interfaces:**
- Consumes: shadcn `Popover`, `PopoverTrigger`, `PopoverContent`, `Button`, `Badge`, `RadioGroup`
- Produces: `SectionVisibilityPopover` with mode selector + entity picker + visibility badge

- [ ] **Step 1: Create the popover component**

```tsx
/**
 * SectionVisibilityPopover — reusable popover for per-section visibility control.
 *
 * Attached to section headers across all tabs. Controls who can see the section
 * and (in the future) whether it appears on the Hub feed.
 *
 * Only registered Equus users with claimed entity profiles can be selected
 * as individual viewers — see AGENTS.md business rules.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Users, Globe, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type VisibilityMode = "owner" | "entities" | "public";

export type SectionVisibility = {
  mode: VisibilityMode;
  entityIds?: string[];
};

type SectionVisibilityPopoverProps = {
  sectionKey: string;
  current: SectionVisibility;
  onChange: (visibility: SectionVisibility) => void;
};

const MODE_ICONS: Record<VisibilityMode, typeof Lock> = {
  owner: Lock,
  entities: Users,
  public: Globe,
};

export function SectionVisibilityPopover({
  sectionKey,
  current,
  onChange,
}: SectionVisibilityPopoverProps) {
  const t = useTranslations("visibility");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<VisibilityMode>(current.mode);

  const Icon = MODE_ICONS[current.mode];

  function handleSave() {
    onChange({ mode, entityIds: current.entityIds });
    setOpen(false);
  }

  const modeLabel = t(`modes.${current.mode}`, { fallback: current.mode });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground h-auto px-1 py-0.5">
          <Icon className="h-3 w-3" />
          <span className="sr-only sm:not-sr-only">{modeLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">{t("title")}</h4>
            <p className="text-xs text-muted-foreground">{t("description")}</p>
          </div>

          <RadioGroup value={mode} onValueChange={(v) => setMode(v as VisibilityMode)}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="owner" id={`${sectionKey}-owner`} />
              <Label htmlFor={`${sectionKey}-owner`} className="text-sm">{t("modes.owner")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="entities" id={`${sectionKey}-entities`} />
              <Label htmlFor={`${sectionKey}-entities`} className="text-sm">{t("modes.entities")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="public" id={`${sectionKey}-public`} />
              <Label htmlFor={`${sectionKey}-public`} className="text-sm">{t("modes.public")}</Label>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {t("save")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Add i18n keys for visibility component**

Add to `messages/en.json`:

```json
"visibility": {
  "title": "Section visibility",
  "description": "Control who can see this section.",
  "modes": {
    "owner": "Only the owner",
    "entities": "Owner + selected entities",
    "public": "Everyone"
  },
  "cancel": "Cancel",
  "save": "Save"
}
```

Add same structure to `messages/es.json` with Spanish translations.

- [ ] **Step 3: Verify the component compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/ui/section-visibility-popover.tsx messages/en.json messages/es.json
git commit -m "feat: add SectionVisibilityPopover component with i18n"
```

---

### Task 3: Create unified EntitySearch component

**Files:**
- Create: `components/ui/entity-search.tsx`
- Reference: `components/invites/provider-invite-picker.tsx` (existing search pattern)

**Interfaces:**
- Consumes: existing `useDiscover` hook pattern or direct fetch
- Produces: `EntitySearch` component that searches all entity types + users

- [ ] **Step 1: Create EntitySearch component**

```tsx
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
import { cn } from "@/lib/utils";

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
  onEmailInvite: (email: string, name?: string) => void;
};

export function EntitySearch({ horseId, onInvite, onEmailInvite }: EntitySearchProps) {
  const t = useTranslations("horseConnect");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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
    onEmailInvite(email.trim(), name.trim() || undefined);
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
          </div>
          <Button size="sm" onClick={handleEmailInvite} disabled={!email.trim()}>
            {t("sendEmailInvite")}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add i18n keys for EntitySearch**

Add to `messages/en.json`:

```json
"horseConnect": {
  "title": "Connect",
  "description": "Invite providers to connect with this horse.",
  "inviteSection": "Invite a provider",
  "connectionsSection": "Connections",
  "searchPlaceholder": "Search by name, email, or username...",
  "searching": "Searching...",
  "noResults": "No matching providers found.",
  "invite": "Invite",
  "invited": "Invited",
  "emailFallbackToggle": "Not on Equus? Invite by email",
  "emailFallbackHint": "They will receive an invitation to sign up and connect.",
  "emailLabel": "Email",
  "nameLabel": "Name (optional)",
  "sendEmailInvite": "Send email invitation",
  "invitationSent": "Invitation sent.",
  "tableType": "Type",
  "tableStatus": "Status",
  "tableName": "Name",
  "tableEmail": "Email",
  "tableSince": "Connected since",
  "tableActions": "Actions",
  "statusActive": "Active",
  "statusPending": "Pending",
  "statusRefused": "Refused",
  "statusEnded": "Ended",
  "endConnection": "End connection",
  "cancelInvitation": "Cancel invitation",
  "connectionEnded": "Connection ended.",
  "invitationCancelled": "Invitation cancelled."
}
```

Add same structure to `messages/es.json` with Spanish translations.

- [ ] **Step 3: Commit**

```bash
git add components/ui/entity-search.tsx messages/en.json messages/es.json
git commit -m "feat: add unified EntitySearch component for Connect tab"
```

---

### Task 4: Update horseTabs configuration

**Files:**
- Modify: `lib/navigation/horseTabs.ts`

**Interfaces:**
- Consumes: existing `EntityTab` type from `@/components/ui/entity-tabs.tsx`
- Produces: Updated `getHorseTabs()` that returns new tab list

- [ ] **Step 1: Update horseTabs config**

```tsx
import type { EntityTab } from "@/components/ui/entity-tabs.tsx";

export function getHorseTabs(horseId: string): EntityTab[] {
  return [
    { id: "hub", label: "Hub", href: `/horses/${horseId}` },
    { id: "connect", label: "Connect", href: `/horses/${horseId}/connect`, requireOwnership: true },
    { id: "edit", label: "Edit", href: `/horses/${horseId}/edit`, requireOwnership: true },
    { id: "admin", label: "Admin", href: `/horses/${horseId}/sale`, requireOwnership: true },
    { id: "history", label: "History", href: `/horses/${horseId}/history` },
  ];
}
```

Note: Relations and Discovery tabs are removed. Sale route is kept (`/horses/${horseId}/sale`) but tab label is "Admin".

- [ ] **Step 2: Verify the file compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/navigation/horseTabs.ts
git commit -m "refactor: update horseTabs — add Connect, remove Relations/Discovery, rename Sale to Admin"
```

---

### Task 5: Create Connect tab route and page

**Files:**
- Create: `app/[locale]/horses/[horseId]/connect/page.tsx`
- Create: `components/horses/horse-connect-page-content.tsx`
- Reference: `components/invites/horse-provider-invites.tsx` (existing invites)
- Reference: `components/horses/horse-relations-page-content.tsx` (existing relations)

**Interfaces:**
- Consumes: `HorsePageShell`, `EntitySearch`, `DataTable`, existing relationship hooks
- Produces: Full Connect tab with invite section + connections table + reviews

- [ ] **Step 1: Create the Connect route page

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseConnectPageContent } from "@/components/horses/horse-connect-page-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/connect", "metadata.horseConnect");
}

export default async function HorseConnectPage({ params }: PageProps) {
  const { horseId } = await params;
  return (
    <Suspense fallback={<div className=" mx-auto p-6">Loading...</div>}>
      <HorseConnectPageContent horseId={horseId} />
    </Suspense>
  );
}
```

- [ ] **Step 2: Create Connect tab content component**

```tsx
/**
 * HorseConnectPageContent — unified connection management tab.
 *
 * Two sections:
 * 1. Invite Provider: search all entity types + email fallback
 * 2. Connections table: all relationships with type, status, actions
 * 3. Reviews: from existing Relations tab
 *
 * Business rule: Only registered Equus users can be invited directly.
 * Email invites create pending relationships that activate upon signup.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { EntitySearch } from "@/components/ui/entity-search.tsx";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHorseProviders, useHorsePendingRelationships } from "@/hooks/queries/useHorse.ts";
import { useEndRelationship } from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { PublicRelationship } from "@/lib/services/relationshipService";

type Props = { horseId: string };

type ConnectionRow = {
  id: string;
  type: string;
  status: "accepted" | "pending" | "refused" | "ended";
  name: string;
  email: string;
  since: string;
  relationship: PublicRelationship;
};

export function HorseConnectPageContent({ horseId }: Props) {
  const t = useTranslations("horseConnect");
  const tTypes = useTranslations("invites.horseProviders.types");
  const toast = useAppToast();
  const { data: currentProviders = [] } = useHorseProviders(horseId, "accepted");
  const { data: pendingRelationships = [] } = useHorsePendingRelationships(horseId);
  const endMutation = useEndRelationship();

  const allRelationships = [...currentProviders, ...pendingRelationships];

  const rows: ConnectionRow[] = allRelationships.map((rel) => ({
    id: rel.id,
    type: tTypes(rel.relationshipType),
    status: rel.status as ConnectionRow["status"],
    name: rel.receiverLabel ?? rel.invitedEmail ?? "-",
    email: rel.invitedEmail ?? "-",
    since: rel.respondedAt
      ? new Date(rel.respondedAt).toLocaleDateString()
      : rel.createdAt
        ? new Date(rel.createdAt).toLocaleDateString()
        : "-",
    relationship: rel,
  }));

  function handleEnd(relationshipId: string) {
    endMutation.mutate(relationshipId, {
      onSuccess: () => toast.success(t("connectionEnded")),
      onError: () => toast.error(t("invitationCancelled")),
    });
  }

  function handleInvite(result: { id: string; name: string; email: string; entityType: string }) {
    // Uses existing invite API — triggers relationship creation
    fetch(`/api/v1/horses/${horseId}/relationships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEntityId: result.id,
        relationshipType: result.entityType,
      }),
    }).then((res) => {
      if (res.ok) toast.success(t("invitationSent"));
      else toast.error(t("invitationCancelled"));
    });
  }

  function handleEmailInvite(email: string, name?: string) {
    fetch(`/api/v1/horses/${horseId}/relationships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invitedEmail: email,
        invitedName: name,
      }),
    }).then((res) => {
      if (res.ok) toast.success(t("invitationSent"));
      else toast.error(t("invitationCancelled"));
    });
  }

  const columns: ColumnDef<ConnectionRow>[] = [
    {
      id: "type",
      header: t("tableType"),
      accessorFn: (row) => row.type,
      sortable: true,
      filterable: true,
    },
    {
      id: "status",
      header: t("tableStatus"),
      accessorFn: (row) => row.status,
      sortable: true,
    },
    {
      id: "name",
      header: t("tableName"),
      accessorFn: (row) => row.name,
      sortable: true,
      filterable: true,
    },
    {
      id: "email",
      header: t("tableEmail"),
      accessorFn: (row) => row.email,
      filterable: true,
    },
    {
      id: "since",
      header: t("tableSince"),
      accessorFn: (row) => row.since,
      sortable: true,
    },
  ];

  return (
    <HorsePageShell horseId={horseId} title={t("title")} requireOwnership>
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t("inviteSection")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <EntitySearch
          horseId={horseId}
          onInvite={handleInvite}
          onEmailInvite={handleEmailInvite}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("connectionsSection")}</h2>
        <DataTable
          columns={columns}
          data={rows}
          filterPlaceholder={t("searchPlaceholder")}
          emptyMessage={t("noResults")}
          onRowAction={(row) =>
            row.status === "accepted" ? (
              <Button variant="outline" size="sm" onClick={() => handleEnd(row.id)}>
                {t("endConnection")}
              </Button>
            ) : row.status === "pending" ? (
              <Button variant="outline" size="sm" onClick={() => handleEnd(row.id)}>
                {t("cancelInvitation")}
              </Button>
            ) : null
          }
        />
      </section>
    </HorsePageShell>
  );
}
```

- [ ] **Step 3: Add metadata i18n keys**

Add to `messages/en.json` under `metadata`:
```json
"horseConnect": {
  "title": "Connect | Equus",
  "description": "Manage provider connections for your horse.",
  "keywords": ""
}
```

Add same to `messages/es.json`.

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/horses/[horseId]/connect/page.tsx components/horses/horse-connect-page-content.tsx messages/en.json messages/es.json
git commit -m "feat: add Connect tab with invite search + connections table"
```

---

### Task 6: Update Hub page — remove Connect providers, simplify to dashboard

**Files:**
- Modify: `components/horses/horse-hub-page-content.tsx`

**Interfaces:**
- Consumes: `HorsePageShell`, horse data
- Produces: Simplified Hub with basic info + pedigree + ownership summary only

- [ ] **Step 1: Update Hub page content**

```tsx
"use client";

import { useTranslations } from "next-intl";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";

type HorseHubPageContentProps = {
  horseId: string;
};

export function HorseHubPageContent({ horseId }: HorseHubPageContentProps) {
  const t = useTranslations("horseHub");
  const tCommon = useTranslations("common");
  const { data: horse } = useOwnerHorse(horseId);

  const horseName = horse?.name ?? tCommon("horseFallback");
  const subtitle = horse?.breed
    ? [horse.breed, horse.sex].filter(Boolean).join(" · ")
    : t("subtitle");

  return (
    <HorsePageShell
      horseId={horseId}
      title={horseName}
      backHref="/horses"
      backLabel={t("backToHorses")}
    >
      <p className="text-muted-foreground -mt-6">{subtitle}</p>

      {/* Basic info summary */}
      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">{t("overview")}</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {horse?.dateOfBirth && (
            <>
              <dt className="text-muted-foreground">{t("age")}</dt>
              <dd>{new Date().getFullYear() - new Date(horse.dateOfBirth).getFullYear()} years</dd>
            </>
          )}
          {horse?.color && (
            <>
              <dt className="text-muted-foreground">{t("color")}</dt>
              <dd>{horse.color}</dd>
            </>
          )}
          {horse?.heightHands && (
            <>
              <dt className="text-muted-foreground">{t("height")}</dt>
              <dd>{horse.heightHands} hh</dd>
            </>
          )}
          {horse?.primaryDiscipline && (
            <>
              <dt className="text-muted-foreground">{t("discipline")}</dt>
              <dd>{horse.primaryDiscipline}</dd>
            </>
          )}
        </dl>
      </section>

      {/* Pedigree section */}
      {horse?.pedigree && (
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">{t("pedigree")}</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {horse.pedigree.sire && (
              <>
                <dt className="text-muted-foreground">{t("sire")}</dt>
                <dd>{horse.pedigree.sire}</dd>
              </>
            )}
            {horse.pedigree.dam && (
              <>
                <dt className="text-muted-foreground">{t("dam")}</dt>
                <dd>{horse.pedigree.dam}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* Ownership summary (view-only for non-owners) */}
      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">{t("ownership.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {horse?.coOwners && horse.coOwners.length > 0
            ? t("ownership.withCoOwners", { count: horse.coOwners.length })
            : t("ownership.soleOwner")}
        </p>
      </section>
    </HorsePageShell>
  );
}
```

- [ ] **Step 2: Remove Connect provider references — delete `HorseProviderInvites` import and usage**

The old hub had:
- Import `HorseProviderInvites`
- Import `useHorsePendingRelationships`, `useHorseOwnershipTransfers`
- Render `<HorseOwnershipHub>` + `<HorseProviderInvites>` section

New hub removes all of those. Keep only the basic info + pedigree sections.

- [ ] **Step 3: Add new i18n keys for Hub dashboard**

Add to `messages/en.json` under `horseHub`:

```json
"horseHub": {
  "backToHorses": "Back to my horses",
  "subtitle": "Horse overview",
  "overview": "Overview",
  "age": "Age",
  "color": "Color",
  "height": "Height",
  "discipline": "Discipline",
  "pedigree": "Pedigree",
  "sire": "Sire",
  "dam": "Dam",
  "ownership": {
    "title": "Ownership",
    "soleOwner": "You are the sole owner of this horse.",
    "withCoOwners": "You have {count} co-owner(s)."
  }
}
```

Remove the old `connectTitle`, `connectDescription` keys (moved to Connect tab). Remove `ownership` sub-keys that are no longer needed here (they move to Admin tab).

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add components/horses/horse-hub-page-content.tsx messages/en.json messages/es.json
git commit -m "refactor: simplify Hub to dashboard view, remove Connect providers section"
```

---

### Task 7: Delete Relations tab and Discovery tab

**Files:**
- Delete: `app/[locale]/horses/[horseId]/relations/` (entire directory)
- Delete: `app/[locale]/horses/[horseId]/discovery/` (entire directory)
- Delete: `components/horses/horse-relations-page-content.tsx`
- Delete: `components/horses/horse-discovery-page-content.tsx`
- Delete: `components/horses/horse-discovery-form.tsx`

- [ ] **Step 1: Remove Relations tab files**

```bash
Remove-Item -Recurse -Force "app/[locale]/horses/[horseId]/relations"
Remove-Item -Force "components/horses/horse-relations-page-content.tsx"
```

- [ ] **Step 2: Remove Discovery tab files**

```bash
Remove-Item -Recurse -Force "app/[locale]/horses/[horseId]/discovery"
Remove-Item -Force "components/horses/horse-discovery-page-content.tsx"
Remove-Item -Force "components/horses/horse-discovery-form.tsx"
```

- [ ] **Step 3: Remove unused i18n keys from messages**

From `messages/en.json` and `messages/es.json`, remove:
- `horseRelations` entire section
- `horseDiscovery` entire section
- `metadata.horseRelations` entry
- `metadata.horseDiscovery` entry

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: No errors (no remaining imports of deleted files)

- [ ] **Step 5: Commit**

```bash
git rm -r "app/[locale]/horses/[horseId]/relations"
git rm -r "app/[locale]/horses/[horseId]/discovery"
git rm "components/horses/horse-relations-page-content.tsx"
git rm "components/horses/horse-discovery-page-content.tsx"
git rm "components/horses/horse-discovery-form.tsx"
git add messages/en.json messages/es.json
git commit -m "refactor: remove Relations and Discovery tabs"
```

---

### Task 8: Rename Sale to Admin — add ownership management + Hub toggle

**Files:**
- Modify: `components/horses/horse-sale-page-content.tsx` → Add ownership management (moved from Hub), rename title
- Modify: `components/horses/horse-sale-form.tsx` — no changes needed (sale form stays)
- Modify: `app/[locale]/horses/[horseId]/sale/page.tsx` — update metadata label to "admin"

- [ ] **Step 1: Update Admin page content — add ownership management + Hub toggle**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseSaleForm } from "@/components/horses/horse-sale-form.tsx";
import { HorseOwnershipHub } from "@/components/horses/horse-ownership-hub.tsx";
import { useHorseOwnershipTransfers } from "@/hooks/queries/useHorse.ts";
import {
  useHorseOwnershipHistory,
} from "@/hooks/queries/useHorse.ts";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
import { queryKeys } from "@/lib/api/queryKeys";

type HorseAdminPageContentProps = {
  horseId: string;
};

export function HorseAdminPageContent({ horseId }: HorseAdminPageContentProps) {
  const t = useTranslations("horseAdmin");
  const tSale = useTranslations("horseSale");
  const queryClient = useQueryClient();
  const { data: horse } = useOwnerHorse(horseId);
  const { data: ownershipTransfers = [] } = useHorseOwnershipTransfers(
    horse?.isMainOwner ? horseId : undefined,
  );
  const { data: ownershipHistory = [] } = useHorseOwnershipHistory(horseId);

  const historyColumns: ColumnDef<typeof ownershipHistory[0]>[] = [
    {
      id: "date",
      header: tSale("historyDate"),
      accessorFn: (row) =>
        row.respondedAt ? new Date(row.respondedAt).toLocaleDateString() : "-",
      sortable: true,
    },
    {
      id: "type",
      header: tSale("historyType"),
      accessorFn: (row) => {
        switch (row.transferKind) {
          case "transfer_main": return tSale("kind.transfer_main");
          case "promote_co_owner": return tSale("kind.promote_co_owner");
          case "remove_co_owner": return tSale("kind.remove_co_owner");
          default: return row.transferKind;
        }
      },
      sortable: true,
    },
    {
      id: "from",
      header: tSale("historyFrom"),
      accessorFn: (row) => row.initiatorLabel ?? "-",
    },
    {
      id: "to",
      header: tSale("historyTo"),
      accessorFn: (row) =>
        row.receiverLabel ?? row.targetCoOwnerLabel ?? "-",
    },
  ];

  return (
    <HorsePageShell horseId={horseId} title={t("pageTitle")} requireOwnership>
      {({ horse, isOwner }) => (
        <>
          {/* Sale settings */}
          <HorseSaleForm
            horseId={horseId}
            horse={horse}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(horseId) });
            }}
          />

          <hr className="my-6" />

          {/* Ownership management (moved from Hub) */}
          {isOwner && (
            <HorseOwnershipHub
              horseId={horseId}
              horse={horse}
              pendingTransfers={ownershipTransfers}
            />
          )}

          <hr className="my-6" />

          {/* Ownership history table */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{tSale("ownershipHistory")}</h2>
            <DataTable
              columns={historyColumns}
              data={ownershipHistory}
              filterPlaceholder={tSale("historyType")}
              emptyMessage={tSale("noHistory")}
            />
          </section>

          <hr className="my-6" />

          {/* Hub toggle */}
          <section className="space-y-4 rounded-lg border p-4">
            <div>
              <h2 className="text-xl font-semibold">{t("hubToggleTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("hubToggleDescription")}</p>
            </div>
            {/* Hub toggle switch — placeholder for future implementation */}
            <p className="text-sm text-muted-foreground">{t("hubToggleComingSoon")}</p>
          </section>
        </>
      )}
    </HorsePageShell>
  );
}
```

- [ ] **Step 2: Update the Sale route page to export Admin content**

```tsx
import { Suspense } from "react";
import { HorseAdminPageContent } from "@/components/horses/horse-admin-page-content.tsx";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = {
  params: Promise<{ locale: string; horseId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/sale", "metadata.horseAdmin");
}

export default async function HorseAdminPage({ params }: PageProps) {
  const { horseId } = await params;
  return (
    <Suspense fallback={<HorseHubPageSkeleton />}>
      <HorseAdminPageContent horseId={horseId} />
    </Suspense>
  );
}
```

- [ ] **Step 3: Create `horse-admin-page-content.tsx`** (rename from sale)

```bash
Copy-Item "components/horses/horse-sale-page-content.tsx" "components/horses/horse-admin-page-content.tsx"
```
Then replace the content with the code from Step 1.

- [ ] **Step 4: Add i18n keys for Admin tab**

Add to `messages/en.json`:

```json
"horseAdmin": {
  "pageTitle": "Admin",
  "hubToggleTitle": "Hub page",
  "hubToggleDescription": "Enable or disable the public Hub page for this horse.",
  "hubToggleComingSoon": "Hub configuration coming in a future update."
}
```

Add `metadata.horseAdmin` entry:
```json
"horseAdmin": {
  "title": "Admin | Equus",
  "description": "Manage sale settings, ownership, and hub configuration for your horse.",
  "keywords": ""
}
```

- [ ] **Step 5: Remove old i18n keys**

From `messages/en.json` and `messages/es.json`:
- Remove `metadata.horseSale` entry (replaced by `metadata.horseAdmin`)
- Remove `horseHub.connectTitle` and `horseHub.connectDescription` (moved to Connect tab)

- [ ] **Step 6: Verify typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add components/horses/horse-admin-page-content.tsx app/[locale]/horses/[horseId]/sale/page.tsx messages/en.json messages/es.json
git commit -m "feat: rename Sale to Admin, add ownership management and Hub toggle"
```

---

### Task 9: Move contact display from Discovery to Edit tab

**Files:**
- Modify: `components/horses/horse-edit-page-content.tsx`

- [ ] **Step 1: Read current Edit page content**

Read `components/horses/horse-edit-page-content.tsx` to understand current structure, then add the contact display section from `horse-discovery-form.tsx` as an additional section after the main edit form.

- [ ] **Step 2: Add contact display section to Edit page**

Add the `HorseContactDisplayForm` section (extracted from the Discovery form) below the main edit form. This includes:
- "Use owner contact" toggle
- Custom contact fields (name, phone, email)
- PATCH endpoint: `/api/v1/horses/${horseId}/discovery`

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/horses/horse-edit-page-content.tsx
git commit -m "refactor: move contact display from Discovery to Edit tab"
```

---

### Task 10: Update documentation and business rules

**Files:**
- Create: `documentation/horseTabs.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Create horse tabs documentation**

Create `documentation/horseTabs.md`:

```markdown
# Horse Tabs

## Current Tab Structure (2026-07-13)

| Tab | Route | Visibility | Purpose |
|-----|-------|-----------|---------|
| Hub | `/horses/[id]` | Public | View-only dashboard with basic info, pedigree, ownership summary |
| Connect | `/horses/[id]/connect` | Owner-only | Invite providers + manage connections table |
| Edit | `/horses/[id]/edit` | Owner-only | Edit basic info + contact display |
| Admin | `/horses/[id]/sale` | Owner-only | Sale settings + ownership management + Hub toggle |
| History | `/horses/[id]/history` | Owner + entities | Activity/audit log |

## Removed Tabs

- **Discovery** (moved contact display to Edit tab; per-section visibility replaces global discovery)
- **Relations** (merged into Connect tab)

## Business Rules

See AGENTS.md for critical business rules about entity registration requirements.
```

- [ ] **Step 2: Update AGENTS.md**

Add the critical business rule to the project overview section (after the "Multi-client architecture" section or in a prominent location):

```markdown
### Critical Business Rules

- **Entity must be Equus user:** No external entity (vet, stable, groomer, trainer, etc.) can interact with a horse through the app unless they are a registered Equus user with an account and claimed entity profile. Email invitations to non-users create pending relationships that only activate upon signup + entity profile creation.
- **Horses can work with anyone:** A horse can have relationships with entities outside the app (in real life). For those horses, the app only provides the Hub (public social feed). All other features require in-app entity connections.
- **Documentation reflects this:** All docs, code comments, and API specifications clearly encode this asymmetry — entities must join the platform to participate, horses have no such restriction.
```

- [ ] **Step 3: Commit**

```bash
git add documentation/horseTabs.md AGENTS.md
git commit -m "docs: add horse tabs documentation and update business rules"
```

---

### Task 11: Update Spanish i18n messages

**Files:**
- Modify: `messages/es.json`

Ensure all new and modified keys from Tasks 1-10 are also reflected in `messages/es.json` with appropriate Spanish translations.

- [ ] **Step 1: Review all en.json changes in this plan and mirror to es.json**

Keys to add to es.json:
- `visibility.*` (from Task 2)
- `horseConnect.*` (from Task 3)
- `metadata.horseConnect` (from Task 5)
- `horseAdmin.*` (from Task 8)
- `metadata.horseAdmin` (from Task 8)

Keys to remove from es.json:
- `horseRelations.*`
- `horseDiscovery.*`
- `metadata.horseRelations`
- `metadata.horseDiscovery`
- `metadata.horseSale`
- `horseHub.connectTitle`
- `horseHub.connectDescription`

- [ ] **Step 2: Commit**

```bash
git add messages/es.json
git commit -m "i18n: sync Spanish messages with new tab structure"
```

---

### Task 12: Final verification

**Files:** (all modified files)

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All existing tests pass

- [ ] **Step 3: Verify no remaining references to deleted files**

```bash
rg "horse-relations-page-content|horse-discovery-page-content|horse-discovery-form" --type ts --type tsx
```
Expected: No results

```bash
rg "horseRelations|horseDiscovery" messages/en.json
```
Expected: Only `horseDiscovery` should remain if referenced elsewhere (confirm none)

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git commit -m "chore: cleanup after tab restructuring"
```

---

## Verification Checklist

After all tasks complete:
- [ ] Hub page shows basic info + pedigree (no Connect providers section)
- [ ] Connect tab exists at `/horses/[id]/connect` with invite search + connections table
- [ ] Relations tab removed (404 if navigating to `/horses/[id]/relations`)
- [ ] Discovery tab removed (404 if navigating to `/horses/[id]/discovery`)
- [ ] Admin tab exists at `/horses/[id]/sale` with sale + ownership + ownership history + Hub toggle
- [ ] Horse tabs show: Hub, Connect, Edit, Admin, History
- [ ] Contact display settings available on Edit tab
- [ ] All old i18n keys removed from both en.json and es.json
- [ ] New i18n keys added to both en.json and es.json
- [ ] DataTable component renders in Connect tab connections table
- [ ] SectionVisibilityPopover component renders on section headers
- [ ] EntitySearch component renders in Connect tab invite section
- [ ] All existing tests pass
- [ ] TypeScript compilation succeeds with no errors
