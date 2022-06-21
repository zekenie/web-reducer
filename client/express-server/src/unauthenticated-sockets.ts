import Bluebird from "bluebird";
import IORedis from "ioredis";
import type { DebouncedFunc } from "lodash";
import { debounce, keyBy, last, uniqBy } from "lodash";
import type { WebSocket } from "ws";

type UnauthenticatedSocketMessage =
  | { type: "new-state"; state: unknown }
  | { type: "bulk-update"; state: unknown };

export const redisConnection = new IORedis(process.env.REDIS_URL!, {
  family: process.env.NODE_ENV! === "production" ? 6 : undefined,
});

class ClientQuery {
  public result?: unknown;

  constructor(
    public readonly queryString: string,
    public readonly readKey: string
  ) {}

  public async fetch() {
    if (this.result) {
      return this.result;
    }
    this.result = await this._fetch();
    return this.result;
  }

  public get slug() {
    return `${this.readKey}/${this.queryString}`;
  }

  private async _fetch() {
    const res = await fetchStateByReadKey({
      readKey: this.readKey,
      queryString: this.queryString,
    });
    return res.json();
  }
}

class ClientSubscription {
  constructor(
    public readonly ws: WebSocket,
    public readonly query: ClientQuery
  ) {}

  public emit(type: UnauthenticatedSocketMessage["type"], state: unknown) {
    this.ws.send(
      JSON.stringify({
        type: type,
        state: state,
      } as UnauthenticatedSocketMessage)
    );
  }

  get readKey() {
    return this.query.readKey;
  }

  get queryString() {
    return this.query.queryString;
  }

  static create({
    ws,
    queryString,
    readKey,
  }: {
    ws: WebSocket;
    queryString: string;
    readKey: string;
  }) {
    return new ClientSubscription(ws, new ClientQuery(queryString, readKey));
  }
}

async function fetchStateByReadKey({
  readKey,
  queryString,
}: {
  readKey: string;
  queryString: string;
}) {
  return fetch(`${process.env.BACKEND_URL}/read/${readKey}${queryString}`, {
    method: "GET",
    headers: {
      Accepts: "application/json",
      "Content-Type": "application/json",
    },
  });
}

async function isReadKeyValid({
  readKey,
  queryString,
}: {
  readKey: string;
  queryString: string;
}): Promise<boolean> {
  const res = await fetchStateByReadKey({ readKey, queryString });

  if (res.status > 299) {
    return false;
  }
  return true;
}

const listeners = {
  lastEmits: {} as { [readKey: string]: number },

  subsForReadKeys: {} as { [readKey: string]: Set<ClientSubscription> },
  async add(readKey: string, sub: ClientSubscription) {
    this.subsForReadKeys[readKey] = this.subsForReadKeys[readKey] || new Set();
    this.subsForReadKeys[readKey].add(sub);
    if (this.subsForReadKeys[readKey].size === 1) {
      // setup redis listener
      await redisConnection.subscribe(`read-key.${readKey}`);
      await redisConnection.subscribe(`read-key.bulk-update.${readKey}`);
    }
  },
  async remove(readKey: string, sub: ClientSubscription) {
    if (!this.subsForReadKeys[readKey]) {
      return;
    }
    this.subsForReadKeys[readKey].delete(sub);
    if (this.subsForReadKeys[readKey].size === 0) {
      delete this.subsForReadKeys[readKey];
      // remove redis listener
      await redisConnection.unsubscribe(`read-key.${readKey}`);
      await redisConnection.unsubscribe(`read-key.bulk-update.${readKey}`);
    }
  },

  emitGate(readKey: string) {
    const lastEmit = this.lastEmits[readKey];
    if (!lastEmit) {
      return true;
    }
    const timeSinceLast = Date.now() - lastEmit;
    return timeSinceLast > 250;
  },

  async emit(readKey: string, message: UnauthenticatedSocketMessage) {
    if (!this.subsForReadKeys[readKey]) {
      return;
    }

    console.log({ message });

    if (!this.emitGate(readKey)) {
      return;
    }
    this.lastEmits[readKey] = Date.now();

    const subscriptions = Array.from(this.subsForReadKeys[readKey]);

    // deduplicate queries
    const queries = uniqBy(
      subscriptions.map((sub) => sub.query),
      "slug"
    );

    // only let 10 concurrent requests go to the read endpoint
    await Bluebird.map(
      queries,
      async (q: ClientQuery) => {
        await q.fetch();
      },
      { concurrency: 10 }
    );

    const queriesBySlug = keyBy(queries, "slug");
    console.log("after fetches", queriesBySlug);

    for (const sub of subscriptions) {
      if (sub.ws.readyState !== sub.ws.OPEN) {
        this.subsForReadKeys[readKey].delete(sub);
      }
      sub.emit(message.type, queriesBySlug[sub.query.slug]!.result!);
    }
  },
};

redisConnection.on(
  "message",
  async (channel: string, messageString: string) => {
    const args = channel.split(".");
    const readKey = last(args) as string;
    const message: UnauthenticatedSocketMessage = JSON.parse(messageString);
    await listeners.emit(readKey, message);
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

  const searchParamsCopy = new URLSearchParams(url.search);
  searchParamsCopy.delete("readKey");
  const serializedSearchParamsWithoutReadKey = `?${searchParamsCopy.toString()}`;

  const isValid = await isReadKeyValid({
    readKey,
    queryString: serializedSearchParamsWithoutReadKey,
  });
  if (!isValid) {
    return rejectConnection(404);
  }

  connect(async (ws) => {
    const sub = ClientSubscription.create({
      readKey,
      ws,
      queryString: serializedSearchParamsWithoutReadKey,
    });
    await listeners.add(readKey, sub);
    ws.on("close", async (r) => {
      await listeners.remove(readKey, sub);
    });
  });
}
