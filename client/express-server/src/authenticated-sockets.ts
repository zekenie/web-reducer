import { parse } from "cookie";
import type { IncomingMessage, Server } from "http";
import IORedis from "ioredis";
import { URL } from "url";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import type { Credentials } from "./auth";
import { getNewCredsWithRefreshToken, verifyJwt } from "./auth";
import { unsign } from "cookie-signature";

type Request = {
  requestId: string;
  state: unknown;
  body: unknown;
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
  hookId: string;
};

type BulkUpdateMessage = {
  type: "bulk-update";
  hookId: string;
};

type SocketMessage = NewRequestMessage | BulkUpdateMessage; // | OtherMessage

const wss = new WebSocketServer({ noServer: true, path: "/hook-events" });

/**
 * redis is probably a temporary pub sub channel.
 * maybe switch to Kafka at greater scale...
 */

export const redisConnection = new IORedis(process.env.REDIS_URL!);

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

export default function attachWebsocketToServer(server: Server): void {
  server.on("upgrade", async function upgrade(request, socket, head) {
    const rejectConnection = (status = 401) => {
      socket.write(`HTTP/1.1 ${status} Unauthorized\r\n\r\n`);
      socket.destroy();
    };
    const { searchParams } = new URL(
      request.url!,
      `http://${request.headers.host}`
    );

    const hookId = searchParams.get("hookId");

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
        return rejectConnection();
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

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
      listeners.add(hookId, ws);
      ws.on("close", () => {
        listeners.remove(hookId, ws);
      });
    });
  });
}
