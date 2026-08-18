"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";

import { MessagesModule } from "@/components/chat/messages-module.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Link } from "@/i18n/navigation.ts";
import { useCreateChatThread } from "@/hooks/queries/useChat.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";

type OpenChatInput = {
  targetUserId: string;
  contextPrefix?: string;
  initialBody?: string;
};

type ChatPopoverContextValue = {
  openChat: (input: OpenChatInput) => Promise<void>;
};

const ChatPopoverContext = createContext<ChatPopoverContextValue | null>(null);

export function useChatPopover() {
  const context = useContext(ChatPopoverContext);
  if (!context) {
    throw new Error("useChatPopover must be used within ChatPopoverProvider");
  }
  return context;
}

export function ChatPopoverProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("messages");
  const { isAuthenticated } = useAppAuth();
  const createThread = useCreateChatThread();
  const [open, setOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();

  const openChat = useCallback(
    async ({ targetUserId, contextPrefix, initialBody }: OpenChatInput) => {
      if (!isAuthenticated) return;
      const result = await createThread.mutateAsync({
        targetUserId,
        contextPrefix,
        initialBody,
      });
      setActiveThreadId(result.thread.id);
      setOpen(true);
    },
    [createThread, isAuthenticated],
  );

  const value = useMemo(() => ({ openChat }), [openChat]);

  if (!isAuthenticated) {
    return <ChatPopoverContext.Provider value={value}>{children}</ChatPopoverContext.Provider>;
  }

  return (
    <ChatPopoverContext.Provider value={value}>
      {children}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<span className="sr-only">{t("title")}</span>} />
        <PopoverContent
          align="end"
          side="top"
          className="hidden w-[min(32rem,calc(100vw-2rem))] p-0 md:block"
        >
          <PopoverHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
            <PopoverTitle>{t("title")}</PopoverTitle>
            <Button variant="ghost" size="sm" render={<Link href="/messages" />}>
              {t("openFullPage")}
            </Button>
          </PopoverHeader>
          <MessagesModule initialThreadId={activeThreadId} className="border-0 rounded-none" />
        </PopoverContent>
      </Popover>
    </ChatPopoverContext.Provider>
  );
}
