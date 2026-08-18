/**
 * Socket.io server for chat live delivery.
 *
 * Single-instance only — Redis adapter deferred until multi-instance deployment.
 */

import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";

import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import { verifyAccessToken } from "@/lib/auth/jwt.ts";
import { assertUserAccountActive } from "@/lib/auth/session.ts";
import type { PublicChatMessage } from "@/lib/services/chatService.ts";

let io: Server | null = null;

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );
}

function extractAccessToken(socket: Socket): string | null {
  const authToken =
    typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : null;
  if (authToken) {
    return authToken;
  }

  const authorization = socket.handshake.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  const cookies = parseCookies(socket.handshake.headers.cookie);
  return cookies[AUTH_CONFIG.ACCESS_COOKIE_NAME] ?? null;
}

async function authenticateSocket(socket: Socket): Promise<string | null> {
  const token = extractAccessToken(socket);
  if (!token) return null;

  try {
    const user = await verifyAccessToken(token);
    await assertUserAccountActive(user.id);
    return user.id;
  } catch {
    return null;
  }
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const userId = await authenticateSocket(socket);
    if (!userId) {
      next(new Error("Unauthorized"));
      return;
    }
    socket.data.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
  });

  return io;
}

export function broadcastMessageNew(
  participantUserIds: string[],
  payload: { threadId: string; message: PublicChatMessage },
): void {
  if (!io) return;

  for (const userId of participantUserIds) {
    io.to(`user:${userId}`).emit("message:new", payload);
    io.to(`user:${userId}`).emit("thread:updated", {
      threadId: payload.threadId,
      lastMessageAt: payload.message.createdAt,
      lastMessagePreview: payload.message.body.slice(0, 200),
    });
  }
}

export function getSocketServer(): Server | null {
  return io;
}
