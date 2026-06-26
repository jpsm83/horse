"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ disabled, onError }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);

    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      onError?.("Google sign in failed");
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleClick}
        disabled={disabled || isLoading}
      >
        {isLoading ? "Redirecting to Google..." : "Continue with Google"}
      </Button>
    </>
  );
}
