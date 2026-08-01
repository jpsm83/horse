/**
 * PreferHydrationBoundary — HydrationBoundary that skips dehydrating a query when
 * the incoming payload would downgrade a richer cached horse/user view (e.g. guest
 * overwriting owner after an expired access token on RSC prefetch).
 */

"use client";

import { useMemo, type ReactNode } from "react";
import {
  HydrationBoundary,
  useQueryClient,
  type DehydratedState,
} from "@tanstack/react-query";

type PreferHydrationBoundaryProps = {
  state: DehydratedState | null | undefined;
  children: ReactNode;
};

function isOwnerScopedHorseView(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const horse = (data as { horse?: { isAdmin?: boolean; isMainOwner?: boolean } }).horse;
  return horse?.isAdmin === true || horse?.isMainOwner === true;
}

function isOwnerScopedUserView(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  return (data as { isOwner?: boolean }).isOwner === true;
}

function incomingIsWeakerView(existing: unknown, incoming: unknown): boolean {
  const existingIsOwnerScoped =
    isOwnerScopedHorseView(existing) || isOwnerScopedUserView(existing);
  const incomingIsOwnerScoped =
    isOwnerScopedHorseView(incoming) || isOwnerScopedUserView(incoming);
  return existingIsOwnerScoped && !incomingIsOwnerScoped;
}

function isEntityViewQueryKey(queryKey: readonly unknown[]): boolean {
  return (
    Array.isArray(queryKey) &&
    queryKey.length >= 3 &&
    (queryKey[0] === "horses" || queryKey[0] === "users") &&
    queryKey[2] === "view" &&
    typeof queryKey[1] === "string"
  );
}

export function PreferHydrationBoundary({
  state,
  children,
}: PreferHydrationBoundaryProps) {
  const queryClient = useQueryClient();

  const filteredState = useMemo((): DehydratedState | null | undefined => {
    if (!state?.queries?.length) return state;

    const queries = state.queries.filter((dehydratedQuery) => {
      if (!isEntityViewQueryKey(dehydratedQuery.queryKey)) return true;

      const existing = queryClient.getQueryData(dehydratedQuery.queryKey);
      if (existing === undefined) return true;

      if (incomingIsWeakerView(existing, dehydratedQuery.state.data)) {
        return false;
      }
      return true;
    });

    if (queries.length === state.queries.length) return state;
    return { ...state, queries };
  }, [state, queryClient]);

  return <HydrationBoundary state={filteredState}>{children}</HydrationBoundary>;
}
