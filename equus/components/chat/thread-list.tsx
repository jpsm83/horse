"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { PublicChatThread } from "@/lib/services/chatService.ts";

type Props = {
  threads: PublicChatThread[];
  selectedThreadId?: string;
  onSelect: (threadId: string) => void;
};

export function ThreadList({ threads, selectedThreadId, onSelect }: Props) {
  const t = useTranslations("messages");

  if (threads.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">{t("emptyThreads")}</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {threads.map((thread) => (
        <li key={thread.id}>
          <button
            type="button"
            onClick={() => onSelect(thread.id)}
            className={cn(
              "flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-muted/50",
              selectedThreadId === thread.id && "bg-muted",
            )}
          >
            <span className="text-sm font-medium text-foreground">
              {t("threadWithUser", { userId: thread.otherUserId.slice(-6) })}
            </span>
            {thread.lastMessagePreview ? (
              <span className="truncate text-xs text-muted-foreground">
                {thread.lastMessagePreview}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
