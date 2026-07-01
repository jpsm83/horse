/**
 * Client-side error reporting types.
 *
 * Used by error boundaries and optional feature-level error handlers.
 */

export type ClientErrorSource = "error-boundary" | "route-error" | "global-error";

export type ClientErrorContext = {
  source: ClientErrorSource;
  componentStack?: string | null;
  digest?: string;
};
