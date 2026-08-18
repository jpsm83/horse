"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

import { appendChatMessage } from "@/hooks/queries/useChat.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import type { PublicChatMessage } from "@/lib/services/chatService.ts";

let sharedSocket: Socket | null = null;

function getChatSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io({
      path: "/socket.io",
      withCredentials: true,
      autoConnect: false,
    });
  }
  return sharedSocket;
}

export function useChatSocketSubscription() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAppAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      sharedSocket?.disconnect();
      return;
    }

    const socket = getChatSocket();
    socket.connect();

    function handleMessageNew(payload: { threadId: string; message: PublicChatMessage }) {
      appendChatMessage(queryClient, payload.threadId, payload.message);
    }

    socket.on("message:new", handleMessageNew);

    return () => {
      socket.off("message:new", handleMessageNew);
      socket.disconnect();
    };
  }, [isAuthenticated, queryClient]);
}
