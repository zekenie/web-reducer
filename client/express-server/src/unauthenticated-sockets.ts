import IORedis from "ioredis";
import { last } from "lodash";
import type { WebSocket } from "ws";

type UnauthenticatedSocketMessage =
  | { type: "new-state"; state: unknown }
  | { type: "bulk-update"; state: unknown };

export const redisConnection = new IORedis(process.env.REDIS_URL!, {
  family: process.env.NODE_ENV! === "production" ? 6 : undefined,
});

async function isReadKeyValid({
  readKey,
}: {
  readKey: string;
}): Promise<boolean> {
  const res = await fetch(`${process.env.BACKEND_URL}/read/${readKey}`, {
    method: "GET",
    headers: {
      Accepts: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (res.status > 299) {
    return false;
  }
  return true;
}

const listeners = {
  websocketsForReadKeys: {} as { [readKey: string]: Set<WebSocket> },
  async add(readKey: string, ws: WebSocket) {
    this.websocketsForReadKeys[readKey] =
      this.websocketsForReadKeys[readKey] || new Set();
    this.websocketsForReadKeys[readKey].add(ws);
    if (this.websocketsForReadKeys[readKey].size === 1) {
      // setup redis listener
      await redisConnection.subscribe(`read-key.${readKey}`);
      await redisConnection.subscribe(`read-key.bulk-update.${readKey}`);
    }
  },
  async remove(readKey: string, ws: WebSocket) {
    if (!this.websocketsForReadKeys[readKey]) {
      return;
    }
    this.websocketsForReadKeys[readKey].delete(ws);
    if (this.websocketsForReadKeys[readKey].size === 0) {
      delete this.websocketsForReadKeys[readKey];
      // remove redis listener
      await redisConnection.unsubscribe(`read-key.${readKey}`);
      await redisConnection.unsubscribe(`read-key.bulk-update.${readKey}`);
    }
  },

  emit(readKey: string, message: UnauthenticatedSocketMessage) {
    if (!this.websocketsForReadKeys[readKey]) {
      return;
    }
    for (const ws of this.websocketsForReadKeys[readKey]) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message, console.log);
      } else {
        listeners.remove(readKey, ws);
      }
    }
  },
};

redisConnection.on(
  "message",
  (channel: string, message: UnauthenticatedSocketMessage) => {
    const args = channel.split(".");
    const readKey = last(args) as string;
    listeners.emit(readKey, message);
  }
);

export async function attach({
  rejectConnection,
  url,
  connect,
}: {
  rejectConnection: (code: number) => void;
  connect: (onConnect: (ws: WebSocket) => void) => void;
  url: URL;
}) {
  const readKey = url.searchParams.get("readKey");
  if (!readKey) {
    return rejectConnection(400);
  }

  const isValid = await isReadKeyValid({ readKey });
  if (!isValid) {
    return rejectConnection(404);
  }

  connect(async (ws) => {
    await listeners.add(readKey, ws);
    ws.on("close", async (r) => {
      await listeners.remove(readKey, ws);
    });
  });
}
