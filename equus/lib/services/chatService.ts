/**
 * Chat service — 1:1 threads, messages, read state, and user blocks.
 *
 * Called by REST routes under `/api/v1/chat` and `/api/v1/users/me/blocks`.
 * Not gated by entity write-lock — chat stays available when stable is locked.
 */

import mongoose from "mongoose";

import ChatMessage from "@/models/ChatMessage.ts";
import ChatThread from "@/models/ChatThread.ts";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { broadcastMessageNew } from "@/lib/chat/socketServer.ts";
import {
  assertCanDirectMessage,
  isEitherUserBlocked,
} from "@/lib/privacy/directMessageAccess.ts";
import { isDocumentActive } from "@/lib/lifecycle/activeQuery.ts";

export type PublicChatThread = {
  id: string;
  participantUserIds: string[];
  otherUserId: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicChatMessage = {
  id: string;
  threadId: string;
  senderUserId: string;
  body: string;
  contextPrefix?: string;
  createdAt: string;
  readByUserIds: string[];
};

type UserBlockEntry = { blockedUserId?: unknown; createdAt?: Date };

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

function sortedParticipantIds(
  userA: string,
  userB: string,
): [mongoose.Types.ObjectId, mongoose.Types.ObjectId] {
  const ids = [
    new mongoose.Types.ObjectId(userA),
    new mongoose.Types.ObjectId(userB),
  ].sort((left, right) => left.toString().localeCompare(right.toString()));
  return [ids[0]!, ids[1]!];
}

function truncatePreview(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length <= 200) return trimmed;
  return `${trimmed.slice(0, 197)}...`;
}

function toPublicThread(
  doc: Record<string, unknown>,
  viewerUserId: string,
): PublicChatThread {
  const participantUserIds = (doc.participantUserIds as unknown[]).map(String);
  const otherUserId =
    participantUserIds.find((id) => id !== viewerUserId) ?? participantUserIds[0] ?? "";

  return {
    id: String(doc._id),
    participantUserIds,
    otherUserId,
    lastMessageAt: doc.lastMessageAt
      ? (doc.lastMessageAt as Date).toISOString()
      : undefined,
    lastMessagePreview: doc.lastMessagePreview as string | undefined,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}

function toPublicMessage(doc: Record<string, unknown>): PublicChatMessage {
  return {
    id: String(doc._id),
    threadId: String(doc.threadId),
    senderUserId: String(doc.senderUserId),
    body: doc.body as string,
    contextPrefix: doc.contextPrefix as string | undefined,
    createdAt: (doc.createdAt as Date).toISOString(),
    readByUserIds: ((doc.readByUserIds as unknown[] | undefined) ?? []).map(String),
  };
}

async function loadThreadForParticipant(
  threadId: string,
  userId: string,
): Promise<Record<string, unknown>> {
  ensureObjectId(threadId, "thread id");
  ensureObjectId(userId, "user id");

  const thread = await ChatThread.findById(threadId).lean();
  if (!thread) {
    throw new ApiError(404, "Thread not found", "NOT_FOUND");
  }

  const participants = (thread.participantUserIds as unknown[]).map(String);
  if (!participants.includes(userId)) {
    throw new ApiError(403, "Not a thread participant", "FORBIDDEN");
  }

  return thread as Record<string, unknown>;
}

async function resolveOtherParticipant(
  thread: Record<string, unknown>,
  senderUserId: string,
): Promise<string> {
  const participants = (thread.participantUserIds as unknown[]).map(String);
  const otherUserId = participants.find((id) => id !== senderUserId);
  if (!otherUserId) {
    throw new ApiError(400, "Invalid thread participants", "VALIDATION_ERROR");
  }
  return otherUserId;
}

export async function findOrCreateThread(
  senderUserId: string,
  targetUserId: string,
  options?: { contextPrefix?: string; initialBody?: string },
): Promise<{ thread: PublicChatThread; created: boolean; message?: PublicChatMessage }> {
  ensureObjectId(senderUserId, "sender user id");
  ensureObjectId(targetUserId, "target user id");

  await assertCanDirectMessage(senderUserId, targetUserId);

  const participantUserIds = sortedParticipantIds(senderUserId, targetUserId);
  let thread = await ChatThread.findOne({ participantUserIds }).lean();
  let created = false;

  if (!thread) {
    const createdThread = await ChatThread.create({ participantUserIds });
    thread = createdThread.toObject();
    created = true;
  }

  let message: PublicChatMessage | undefined;
  if (options?.initialBody?.trim()) {
    const sendResult = await sendMessage(String(thread._id), senderUserId, {
      body: options.initialBody.trim(),
      contextPrefix: created ? options.contextPrefix?.trim() : undefined,
    });
    message = sendResult.message;
    thread = (await ChatThread.findById(thread._id).lean()) as Record<string, unknown>;
  }

  return {
    thread: toPublicThread(thread as Record<string, unknown>, senderUserId),
    created,
    message,
  };
}

export async function listThreads(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ threads: PublicChatThread[]; total: number; page: number; pageSize: number }> {
  ensureObjectId(userId, "user id");

  const objectId = new mongoose.Types.ObjectId(userId);
  const filter = { participantUserIds: objectId };
  const [total, rows] = await Promise.all([
    ChatThread.countDocuments(filter),
    ChatThread.find(filter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);

  return {
    threads: rows.map((row) => toPublicThread(row as Record<string, unknown>, userId)),
    total,
    page,
    pageSize,
  };
}

export async function listMessages(
  threadId: string,
  userId: string,
  options?: { before?: string; limit?: number },
): Promise<{ messages: PublicChatMessage[] }> {
  await loadThreadForParticipant(threadId, userId);

  const limit = options?.limit ?? 50;
  const query: Record<string, unknown> = { threadId: new mongoose.Types.ObjectId(threadId) };
  if (options?.before) {
    if (!mongoose.Types.ObjectId.isValid(options.before)) {
      throw new ApiError(400, "Invalid before cursor", "VALIDATION_ERROR");
    }
    query._id = { $lt: new mongoose.Types.ObjectId(options.before) };
  }

  const rows = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    messages: rows.reverse().map((row) => toPublicMessage(row as Record<string, unknown>)),
  };
}

export async function sendMessage(
  threadId: string,
  senderUserId: string,
  input: { body: string; contextPrefix?: string },
): Promise<{ message: PublicChatMessage }> {
  const thread = await loadThreadForParticipant(threadId, senderUserId);
  const otherUserId = await resolveOtherParticipant(thread, senderUserId);

  await assertCanDirectMessage(senderUserId, otherUserId);

  const body = input.body.trim();
  const existingCount = await ChatMessage.countDocuments({ threadId });
  const contextPrefix =
    existingCount === 0 && input.contextPrefix?.trim()
      ? input.contextPrefix.trim()
      : undefined;

  const created = await ChatMessage.create({
    threadId: new mongoose.Types.ObjectId(threadId),
    senderUserId: new mongoose.Types.ObjectId(senderUserId),
    body,
    contextPrefix,
    readByUserIds: [new mongoose.Types.ObjectId(senderUserId)],
  });

  await ChatThread.findByIdAndUpdate(threadId, {
    lastMessageAt: created.createdAt,
    lastMessagePreview: truncatePreview(body),
  });

  const message = toPublicMessage(created.toObject() as Record<string, unknown>);
  const participants = (thread.participantUserIds as unknown[]).map(String);
  broadcastMessageNew(participants, { threadId, message });

  return { message };
}

export async function markThreadRead(threadId: string, userId: string): Promise<void> {
  await loadThreadForParticipant(threadId, userId);

  const userObjectId = new mongoose.Types.ObjectId(userId);
  await ChatMessage.updateMany(
    {
      threadId: new mongoose.Types.ObjectId(threadId),
      senderUserId: { $ne: userObjectId },
      readByUserIds: { $ne: userObjectId },
    },
    { $addToSet: { readByUserIds: userObjectId } },
  );
}

export async function listBlockedUserIds(userId: string): Promise<string[]> {
  ensureObjectId(userId, "user id");

  const user = await User.findById(userId).select("blocks").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  return ((user.blocks ?? []) as UserBlockEntry[])
    .map((entry) => (entry.blockedUserId != null ? String(entry.blockedUserId) : null))
    .filter((id): id is string => Boolean(id));
}

export async function blockUser(userId: string, blockedUserId: string): Promise<void> {
  ensureObjectId(userId, "user id");
  ensureObjectId(blockedUserId, "blocked user id");

  if (userId === blockedUserId) {
    throw new ApiError(400, "Cannot block yourself", "VALIDATION_ERROR");
  }

  const target = await User.findById(blockedUserId).select("isActive").lean();
  if (!isDocumentActive(target)) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const user = await User.findById(userId).select("blocks").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const blocks = (user.blocks ?? []) as UserBlockEntry[];
  if (blocks.some((entry) => entry.blockedUserId != null && String(entry.blockedUserId) === blockedUserId)) {
    return;
  }

  await User.findByIdAndUpdate(userId, {
    $push: {
      blocks: {
        blockedUserId: new mongoose.Types.ObjectId(blockedUserId),
        createdAt: new Date(),
      },
    },
  });
}

export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
  ensureObjectId(userId, "user id");
  ensureObjectId(blockedUserId, "blocked user id");

  await User.findByIdAndUpdate(userId, {
    $pull: {
      blocks: { blockedUserId: new mongoose.Types.ObjectId(blockedUserId) },
    },
  });
}

export async function assertCanSendInThread(threadId: string, senderUserId: string): Promise<string> {
  const thread = await loadThreadForParticipant(threadId, senderUserId);
  const otherUserId = await resolveOtherParticipant(thread, senderUserId);
  if (await isEitherUserBlocked(senderUserId, otherUserId)) {
    throw new ApiError(403, "Direct messaging is blocked", "FORBIDDEN");
  }
  return otherUserId;
}
