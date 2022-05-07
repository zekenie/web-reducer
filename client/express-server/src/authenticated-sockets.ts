import type { Request, Response } from "express";
import type { IncomingMessage, Server } from "http";
import IORedis from "ioredis";
import { URL } from "url";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import type { Credentials } from "./auth";
import {
  cookieParserMiddleware,
  getNewCredsWithRefreshToken,
  verifyJwt,
} from "./auth";

type StateHistory = {
  requestId: string;
  state: unknown;
  body: unknown;
  error: any;
  console: any[];
  createdAt: Date;
};

type SocketMessage = {
  state: StateHistory;
  readKeys: string[];
  hookId: string;
};

const wss = new WebSocketServer({ noServer: true, path: "/hook-events" });

/**
 * redis is probably a temporary pub sub channel.
 * maybe switch to Kafka at greater scale...
 */

const redisConnection = new IORedis(process.env.REDIS_URL!);

function hackyWrapperAroundCookieParser(
  req: IncomingMessage
): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    cookieParserMiddleware(req as Request, {} as Response, () => {
      // @ts-ignore
      resolve(req["signedCookies"] as unknown as any);
    });
  });
}

export async function doesUserHaveHookAccess({
  hookId,
  creds,
}: {
  hookId: string;
  creds: Credentials;
}): Promise<boolean> {
  const res = await fetch(`${process.env.BACKEND_URL}/hooks/${hookId}`, {
    method: "GET",
    headers: {
      Accepts: "application/json",
      "Content-Type": "application/json",
      Authorization: creds.jwt,
    },
  });

  if (res.status > 299) {
    return false;
  }
  return true;
}

const listeners = {
  websocketsForHookIds: {} as { [hookId: string]: Set<WebSocket> },
  add(hookId: string, ws: WebSocket) {
    this.websocketsForHookIds[hookId] = this.websocketsForHookIds[hookId] || [];
    this.websocketsForHookIds[hookId].add(ws);
    if (this.websocketsForHookIds[hookId].size === 1) {
      // setup redis listener
      redisConnection.subscribe(`state.${hookId}`);
    }
  },
  remove(hookId: string, ws: WebSocket) {
    if (!this.websocketsForHookIds[hookId]) {
      return;
    }
    this.websocketsForHookIds[hookId].delete(ws);
    if (this.websocketsForHookIds[hookId].size === 0) {
      delete this.websocketsForHookIds[hookId];
      // remove redis listener
      redisConnection.unsubscribe(`state.${hookId}`);
    }
  },

  emit(hookId: string, message: SocketMessage) {
    if (!this.websocketsForHookIds[hookId]) {
      return;
    }
    for (const ws of this.websocketsForHookIds[hookId]) {
      if (ws.readyState === ws.OPEN) {
        ws.emit("state", message);
      }
    }
  },
};

redisConnection.on(
  "message",
  (channel: `state.${string}`, message: SocketMessage) => {
    const [_, hookId] = channel.split(".");
    listeners.emit(hookId, message);
  }
);

export default function attachWebsocketToServer(server: Server): void {
  server.on("upgrade", async function upgrade(request, socket, head) {
    const rejectConnection = () => {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    };

    const { search } = new URL(request.url!);
    const searchParams = new URLSearchParams(search);

    const hookId = searchParams.get("hookId");

    if (!hookId) {
      return rejectConnection();
    }

    const cookies = await hackyWrapperAroundCookieParser(request);
    const credsString = cookies.credentials;
    let creds: Credentials | null = credsString
      ? JSON.parse(credsString)
      : null;

    if (!creds) {
      return rejectConnection();
    }

    if (!verifyJwt(creds.jwt)) {
      try {
        creds = await getNewCredsWithRefreshToken(creds);
      } catch (e) {
        return rejectConnection();
      }
    }

    if (
      !(await doesUserHaveHookAccess({
        creds,
        hookId,
      }))
    ) {
      return rejectConnection();
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
      listeners.add(hookId, ws);
      ws.on("close", () => {
        listeners.remove(hookId, ws);
      });
    });
  });
}
