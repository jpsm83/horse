/**
 * TanStack Query hooks for 1:1 chat threads and messages.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicChatMessage, PublicChatThread } from "@/lib/services/chatService.ts";

type ThreadListResponse = {
  threads: PublicChatThread[];
  total: number;
  page: number;
  pageSize: number;
};

type MessageListResponse = {
  messages: PublicChatMessage[];
};

type CreateThreadResponse = {
  thread: PublicChatThread;
  created: boolean;
  message?: PublicChatMessage;
};

async function fetchThreads(): Promise<ThreadListResponse> {
  const response = await fetchWithAuth("/api/v1/chat/threads");
  return parseApiResponse<ThreadListResponse>(response);
}

async function fetchMessages(threadId: string): Promise<PublicChatMessage[]> {
  const response = await fetchWithAuth(
    `/api/v1/chat/threads/${encodeURIComponent(threadId)}/messages`,
  );
  const data = await parseApiResponse<MessageListResponse>(response);
  return data.messages;
}

async function createThreadApi(input: {
  targetUserId: string;
  contextPrefix?: string;
  initialBody?: string;
}): Promise<CreateThreadResponse> {
  const response = await fetchWithAuth("/api/v1/chat/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<CreateThreadResponse>(response);
}

async function sendMessageApi(threadId: string, body: string, contextPrefix?: string) {
  const response = await fetchWithAuth(
    `/api/v1/chat/threads/${encodeURIComponent(threadId)}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, contextPrefix }),
    },
  );
  return parseApiResponse<{ message: PublicChatMessage }>(response);
}

async function markThreadReadApi(threadId: string) {
  const response = await fetchWithAuth(
    `/api/v1/chat/threads/${encodeURIComponent(threadId)}/read`,
    { method: "PATCH" },
  );
  return parseApiResponse<{ success: boolean }>(response);
}

async function fetchBlockedUserIds(): Promise<string[]> {
  const response = await fetchWithAuth("/api/v1/users/me/blocks");
  const data = await parseApiResponse<{ blockedUserIds: string[] }>(response);
  return data.blockedUserIds;
}

async function blockUserApi(blockedUserId: string) {
  const response = await fetchWithAuth("/api/v1/users/me/blocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blockedUserId }),
  });
  return parseApiResponse<{ success: boolean }>(response);
}

async function unblockUserApi(blockedUserId: string) {
  const response = await fetchWithAuth(
    `/api/v1/users/me/blocks/${encodeURIComponent(blockedUserId)}`,
    { method: "DELETE" },
  );
  return parseApiResponse<{ success: boolean }>(response);
}

export function useChatThreads() {
  return useQuery({
    queryKey: queryKeys.chat.threads(),
    queryFn: fetchThreads,
    staleTime: 15_000,
  });
}

export function useChatMessages(threadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.messages(threadId ?? "none"),
    queryFn: () => fetchMessages(threadId!),
    enabled: Boolean(threadId),
    staleTime: 5_000,
  });
}

export function useCreateChatThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThreadApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.threads() });
      if (data.message) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(data.thread.id) });
      }
    },
  });
}

export function useSendChatMessage(threadId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, contextPrefix }: { body: string; contextPrefix?: string }) =>
      sendMessageApi(threadId!, body, contextPrefix),
    onSuccess: () => {
      if (!threadId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(threadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.threads() });
    },
  });
}

export function useMarkChatThreadRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markThreadReadApi,
    onSuccess: (_data, threadId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(threadId) });
    },
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: queryKeys.chat.blocks(),
    queryFn: fetchBlockedUserIds,
    staleTime: 30_000,
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: blockUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.blocks() });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unblockUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.blocks() });
    },
  });
}

export function appendChatMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  threadId: string,
  message: PublicChatMessage,
) {
  queryClient.setQueryData<PublicChatMessage[]>(queryKeys.chat.messages(threadId), (current) => {
    const existing = current ?? [];
    if (existing.some((entry) => entry.id === message.id)) {
      return existing;
    }
    return [...existing, message];
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.chat.threads() });
}
