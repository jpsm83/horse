"use client";

/**
 * Email-only invite UI for ownership and admin role invites.
 * Does not search users — invites resolve existing accounts server-side from email.
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type EmailInviteLabels = {
  hint: string;
  emailLabel: string;
  sendLabel: string;
};

type EmailInviteSectionProps = {
  isInviting: boolean;
  onEmailInvite: (email: string) => void;
  labels: EmailInviteLabels;
};

export function EmailInviteSection({
  isInviting,
  onEmailInvite,
  labels,
}: EmailInviteSectionProps) {
  const [email, setEmail] = useState("");

  function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed) return;
    onEmailInvite(trimmed);
    setEmail("");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{labels.hint}</p>
      <div className="space-y-2">
        <Label htmlFor="admin-email-invite">{labels.emailLabel}</Label>
        <Input
          id="admin-email-invite"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isInviting}
        />
      </div>
      <Button
        type="button"
        size="sm"
        onClick={handleSubmit}
        disabled={!email.trim() || isInviting}
      >
        {labels.sendLabel}
      </Button>
    </div>
  );
}
