"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { MessageComposer } from "@/components/chat/message-composer.tsx";
import { ThreadList } from "@/components/chat/thread-list.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  useChatMessages,
  useChatThreads,
  useMarkChatThreadRead,
  useSendChatMessage,
} from "@/hooks/queries/useChat.ts";
import { cn } from "@/lib/utils";

type Props = {
  initialThreadId?: string;
  className?: string;
};

export function MessagesModule({ initialThreadId, className }: Props) {
  const t = useTranslations("messages");
  const { data: threadData, isPending: threadsPending } = useChatThreads();
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(initialThreadId);

  const threads = threadData?.threads ?? [];
  const activeThreadId = selectedThreadId ?? initialThreadId ?? threads[0]?.id;

  const { data: messages = [], isPending: messagesPending } = useChatMessages(activeThreadId);
  const sendMessage = useSendChatMessage(activeThreadId);
  const markRead = useMarkChatThreadRead();

  useEffect(() => {
    if (!activeThreadId) return;
    void markRead.mutate(activeThreadId);
  }, [activeThreadId, markRead, messages.length]);

  if (threadsPending) {
    return (
      <div className={cn("flex min-h-[24rem] items-center justify-center", className)}>
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className={cn("grid min-h-[24rem] grid-cols-1 overflow-hidden rounded-lg border border-border md:grid-cols-[16rem_1fr]", className)}>
      <aside className="border-b border-border md:border-b-0 md:border-r">
        <ThreadList
          threads={threads}
          selectedThreadId={activeThreadId}
          onSelect={setSelectedThreadId}
        />
      </aside>

      <section className="flex min-h-[24rem] flex-col">
        {!activeThreadId ? (
          <p className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
            {t("selectThread")}
          </p>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messagesPending ? (
                <div className="flex justify-center py-8">
                  <Spinner className="size-5" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("emptyMessages")}</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    {message.contextPrefix ? (
                      <p className="text-xs text-muted-foreground">{message.contextPrefix}</p>
                    ) : null}
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                      {message.body}
                    </div>
                  </div>
                ))
              )}
            </div>
            <MessageComposer
              disabled={!activeThreadId}
              isPending={sendMessage.isPending}
              onSend={async (body) => {
                if (!activeThreadId) return;
                await sendMessage.mutateAsync({ body });
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
