"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchCurrentUser,
  formatAuthProvider,
  logoutFromApi,
  syncApiSession,
} from "@/lib/api/authClient.ts";
import type { AuthUser } from "@/lib/auth/types.ts";
import { cn } from "@/lib/utils";

export function HomePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadAuthState = useCallback(async () => {
    setError(null);

    try {
      if (session?.user?.id) {
        await syncApiSession();
      }

      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    void (async () => {
      setIsLoading(true);
      try {
        await loadAuthState();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadAuthState, sessionStatus]);

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(null);

    try {
      await logoutFromApi();
      if (session) {
        await signOut({ callbackUrl: "/signin" });
        return;
      }
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  }

  const isAuthenticated = user !== null;

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Equus
          </Link>
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </Button>
            ) : (
              <>
                <Link
                  href="/signin"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Sign in
                </Link>
                <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-12">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to Equus</h1>
          <p className="text-muted-foreground">
            Test authentication with email/password or Google sign-in.
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading session...</CardTitle>
            </CardHeader>
          </Card>
        ) : isAuthenticated && user ? (
          <Card>
            <CardHeader>
              <CardTitle>You are signed in</CardTitle>
              <CardDescription>Authenticated via the REST API session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">User ID:</span> {user.id}
              </p>
              <p>
                <span className="font-medium">Provider:</span>{" "}
                {formatAuthProvider(user.authProvider)}
              </p>
              <p>
                <span className="font-medium">Email verified:</span>{" "}
                {user.emailVerified ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-medium">Profile complete:</span>{" "}
                {user.profileComplete ? "Yes" : "No"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Get started</CardTitle>
              <CardDescription>
                Sign in or create an account to verify the auth flows.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/signin" className={cn(buttonVariants())}>
                Sign in
              </Link>
              <Link href="/signup" className={cn(buttonVariants({ variant: "outline" }))}>
                Sign up
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
