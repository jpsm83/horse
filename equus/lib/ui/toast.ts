/**
 * App-wide toast API — wraps shadcn Sonner.
 * Feature code should use `useAppToast()` or `appToast`; never import `sonner` directly.
 */

import { toast } from "sonner";

export const appToast = {
  success(message: string) {
    toast.success(message);
  },
  error(message: string) {
    toast.error(message);
  },
};
