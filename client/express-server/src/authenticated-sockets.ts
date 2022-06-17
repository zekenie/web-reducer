import { parse } from "cookie";
import type { IncomingMessage, Server } from "http";
import IORedis from "ioredis";
import type { URL } from "url";
import type { WebSocket } from "ws";
import type { Credentials } from "./auth";
import { getNewCredsWithRefreshToken, verifyJwt } from "./auth";
import { unsign } from "cookie-signature";

type Request = {
  requestId: string;
  state: unknown;
  body: unknown;
  headers: Record<string, string>;
  queryString: string;
  bodyHash: string;
  stateHash: string;
  error: any;
  console: any[];
  createdAt: Date;
};

type NewRequestMessage = {
  type: "new-request";
  request: Request;
  readKeys: string[];
  requestCount: number;
  hookId: string;
};

type BulkUpdateMessage = {
  type: "bulk-update";
  hookId: string;
  state: unknown;
};

type SocketMessage = NewRequestMessage | BulkUpdateMessage; // | OtherMessage

/**
 * redis is probably a temporary pub sub channel.
 * maybe switch to Kafka at greater scale...
 */

export const redisConnection = new IORedis(process.env.REDIS_URL!, {
  family: process.env.NODE_ENV! === "production" ? 6 : undefined,
});

function getCredsFromRequest(req: IncomingMessage): Credentials | null {
  if (!req.headers.cookie) {
    return null;
  }
  const cookies = parse(req.headers.cookie);
  let cookieStr = cookies.credentials;

  if (cookieStr.startsWith("s:")) {
    cookieStr = cookieStr.slice(2);
  }
  const unsigned = unsign(cookieStr, process.env.COOKIE_SECRET!);
  if (!unsigned) {
    return null;
  }
  return JSON.parse(unsigned);
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
    this.websocketsForHookIds[hookId] =
      this.websocketsForHookIds[hookId] || new Set();
    this.websocketsForHookIds[hookId].add(ws);
    if (this.websocketsForHookIds[hookId].size === 1) {
      // setup redis listener
      redisConnection.subscribe(`state.${hookId}`);
      redisConnection.subscribe(`bulk-update.${hookId}`);
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
      redisConnection.unsubscribe(`bulk-update.${hookId}`);
    }
  },

  emit(hookId: string, message: SocketMessage) {
    if (!this.websocketsForHookIds[hookId]) {
      return;
    }
    for (const ws of this.websocketsForHookIds[hookId]) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
  },
};

redisConnection.on("message", (channel: string, message: SocketMessage) => {
  const [type, hookId] = channel.split(".");
  listeners.emit(hookId, message);
});

export async function attach({
  rejectConnection,
  url,
  request,
  connect,
}: {
  rejectConnection: (code: number) => void;
  connect: (onConnect: (ws: WebSocket) => void) => void;
  request: IncomingMessage;
  url: URL;
}) {
  const hookId = url.searchParams.get("hookId");
  if (!hookId) {
    return rejectConnection(400);
  }
  let creds = getCredsFromRequest(request);

  if (!creds) {
    return rejectConnection(401);
  }

  if (!verifyJwt(creds.jwt)) {
    try {
      creds = await getNewCredsWithRefreshToken(creds);
    } catch (e) {
      return rejectConnection(401);
    }
  }

  if (
    !(await doesUserHaveHookAccess({
      creds,
      hookId,
    }))
  ) {
    return rejectConnection(403);
  }
  connect((ws) => {
    listeners.add(hookId, ws);
    ws.on("close", () => {
      listeners.remove(hookId, ws);
    });
  });
}
