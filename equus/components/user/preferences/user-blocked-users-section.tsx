/**
 * UserBlockedUsersSection — manage direct-message block list.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useBlockUser, useBlockedUsers, useUnblockUser } from "@/hooks/queries/useChat.ts";

export function UserBlockedUsersSection() {
  const t = useTranslations("messages");
  const { data: blockedUserIds = [], isPending } = useBlockedUsers();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const [userIdToBlock, setUserIdToBlock] = useState("");

  async function handleBlock() {
    const trimmed = userIdToBlock.trim();
    if (!trimmed) return;
    await blockUser.mutateAsync(trimmed);
    setUserIdToBlock("");
  }

  if (isPending) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="size-5" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={userIdToBlock}
          onChange={(event) => setUserIdToBlock(event.target.value)}
          placeholder={t("blockUserIdPlaceholder")}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={!userIdToBlock.trim() || blockUser.isPending}
          onClick={() => void handleBlock()}
        >
          {t("blockUser")}
        </Button>
      </div>

      {blockedUserIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noBlockedUsers")}</p>
      ) : (
        <ul className="space-y-2">
          {blockedUserIds.map((blockedUserId) => (
            <li
              key={blockedUserId}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="truncate font-mono text-xs">{blockedUserId}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={unblockUser.isPending}
                onClick={() => void unblockUser.mutateAsync(blockedUserId)}
              >
                {t("unblockUser")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
