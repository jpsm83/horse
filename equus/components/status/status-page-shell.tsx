/**
 * Centered status layout for 404, forbidden, and other full-page outcomes.
 * Global AppHeader provides branding.
 */

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";

export type StatusPageAction = {
  label: string;
  href: string;
  variant?: "default" | "outline";
};

type StatusPageShellProps = {
  title: string;
  description: string;
  actions?: StatusPageAction[];
  children?: React.ReactNode;
};

export function StatusPageShell({
  title,
  description,
  actions = [],
  children,
}: StatusPageShellProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          {children || actions.length > 0 ? (
            <CardContent className="space-y-4">
              {children}
              {actions.length > 0 ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {actions.map((action) => (
                    <Link
                      key={action.href + action.label}
                      href={action.href}
                      className={cn(
                        buttonVariants({
                          variant: action.variant ?? "default",
                        }),
                        "w-full sm:w-auto",
                      )}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </CardContent>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
