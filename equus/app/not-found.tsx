/**
 * Non-localized 404 fallback for requests outside the [locale] tree
 * (e.g. static files excluded from the proxy matcher). Must not use
 * next-intl client APIs — no NextIntlClientProvider at this level.
 */

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Page not found</CardTitle>
            <CardDescription>
              The page you are looking for does not exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <a href="/" className={cn(buttonVariants(), "w-full sm:w-auto")}>
                Home
              </a>
              <a
                href="/signin"
                className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
              >
                Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
