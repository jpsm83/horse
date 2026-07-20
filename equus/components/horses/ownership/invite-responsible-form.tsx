"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";

type InviteResponsibleFormProps = {
  horseId: string;
  onSubmit: (email: string) => void;
  isPending?: boolean;
};

export function InviteResponsibleForm({ horseId, onSubmit, isPending }: InviteResponsibleFormProps) {
  const [email, setEmail] = useState("");

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.trim()) return;
        onSubmit(email.trim());
        setEmail("");
      }}
    >
      <Input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-9"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        Invite
      </Button>
    </form>
  );
}
