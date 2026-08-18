"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";

type Props = {
  disabled?: boolean;
  isPending?: boolean;
  onSend: (body: string) => void | Promise<void>;
};

export function MessageComposer({ disabled, isPending, onSend }: Props) {
  const t = useTranslations("messages");
  const [body, setBody] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || disabled || isPending) return;
    await onSend(trimmed);
    setBody("");
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-2 border-t border-border p-4">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t("composerPlaceholder")}
        rows={3}
        disabled={disabled || isPending}
        maxLength={4000}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || isPending || !body.trim()}>
          {t("send")}
        </Button>
      </div>
    </form>
  );
}
