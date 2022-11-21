import { parse } from "cookie";
import type { IncomingMessage } from "http";
import IORedis from "ioredis";
import type { URL } from "url";
import type { WebSocket } from "ws";
import type { Credentials } from "./auth";
import { getNewCredsWithRefreshToken, verifyJwt } from "./auth";
import { unsign } from "cookie-signature";
import { countBy, mapValues } from "lodash";

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

type Connection = {
  ws: WebSocket;
  alive: boolean;
  hookId: string;
};

const listeners = {
  get allConnections() {
    return Object.values(this.websocketsForHookIds).reduce((arr, set) => {
      return [...arr, ...Array.from(set)];
    }, [] as Connection[]);
  },
  websocketsForHookIds: {} as { [hookId: string]: Set<Connection> },
  add(hookId: string, connection: Connection) {
    console.log("add", hookId);
    this.websocketsForHookIds[hookId] =
      this.websocketsForHookIds[hookId] || new Set();
    this.websocketsForHookIds[hookId].add(connection);
    if (this.websocketsForHookIds[hookId].size === 1) {
      // setup redis listener
      redisConnection.subscribe(`state.${hookId}`);
      redisConnection.subscribe(`bulk-update.${hookId}`);
    }
  },
  remove(hookId: string, connection: Connection) {
    console.log("remove", hookId);
    if (!this.websocketsForHookIds[hookId]) {
      return;
    }
    this.websocketsForHookIds[hookId].delete(connection);
    if (this.websocketsForHookIds[hookId].size === 0) {
      delete this.websocketsForHookIds[hookId];
      // remove redis listener
      redisConnection.unsubscribe(`state.${hookId}`);
      redisConnection.unsubscribe(`bulk-update.${hookId}`);
    }
  },

  emit(hookId: string, message: SocketMessage) {
    console.log("emit", hookId);
    if (!this.websocketsForHookIds[hookId]) {
      return;
    }
    for (const con of this.websocketsForHookIds[hookId]) {
      if (con.ws.readyState === con.ws.OPEN) {
        con.ws.send(message);
      } else {
        console.log("ready state not open");
        this.remove(hookId, con);
      }
    }
  },
};

redisConnection.on("message", (channel: string, message: SocketMessage) => {
  const [type, hookId] = channel.split(".");
  console.log("from redis", type, hookId);
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
    const connection = { ws, alive: true, hookId };
    listeners.add(hookId, connection);
    ws.on("message", (message) => {
      if (message.toString() === "pong") {
        connection.alive = true;
      }
    });

    ws.send("ping");

    ws.on("close", (code, reason) => {
      console.log("closing authenticated socket", code, reason.toString());
      listeners.remove(hookId, connection);
    });
  });
}

setInterval(() => {
  console.log(
    "current state of listeners",
    mapValues(listeners.websocketsForHookIds, (l) => {
      const arr = Array.from(l);
      return {
        size: l.size,
        byReadyState: countBy(arr, (item) => item.ws.readyState),
        byAlive: countBy(arr, (item) => item.alive),
      };
    })
  );
}, 5000);

setInterval(() => {
  for (const connection of listeners.allConnections) {
    if (!connection.alive) {
      connection.ws.close(1000, "no ping message");
      listeners.remove(connection.hookId, connection);
    }
    connection.alive = false;
  }
}, 30_000);

setInterval(() => {
  for (const connection of listeners.allConnections) {
    connection.ws.send("ping");
  }
}, 5_000);

function closeGracefully(signal: string) {
  try {
    for (const connection of listeners.allConnections) {
      connection.ws.close();
    }
  } catch (e) {
    console.error("error responding to ", signal);
    process.exit(1);
  }
}
process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);
