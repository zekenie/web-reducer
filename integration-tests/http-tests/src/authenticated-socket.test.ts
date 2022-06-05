import { serialize } from "cookie";
import { randomUUID } from "crypto";
import { WebSocket } from "ws";
import { buildAuthenticatedApi, HookDetail } from "./hook-builder";
import { allQueuesDrained } from "./server-internals";
import { serverTestSetup } from "./setup";
import { sign } from "cookie-signature";

type Credentials = {
  jwt: string;
  refreshToken: string;
};
function cookieForCreds(creds: Credentials) {
  return serialize(
    "credentials",
    `s:${sign(JSON.stringify(creds), process.env.COOKIE_SECRET!)}`,
    {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    }
  );
}

export function convertEventToPromise<T>(event: string, ws: WebSocket) {
  return new Promise<T[]>((resolve) => {
    ws.on(event, (...args) => {
      resolve(args);
    });
  });
}

export function convertMessageEventToPromise<T = any>(
  ws: WebSocket,
  matcher: (e: T) => boolean
): Promise<T> {
  return new Promise<T>((resolve) => {
    ws.on("message", (messageBuffer) => {
      const message = JSON.parse(messageBuffer.toString()) as T;
      if (matcher(message)) {
        resolve(message);
      }
    });
  });
}

describe("authenticated socket", () => {
  serverTestSetup();
  let api: Awaited<ReturnType<typeof buildAuthenticatedApi>>;
  let hook: HookDetail;
  beforeEach(async () => {
    api = await buildAuthenticatedApi();
    hook = (await api.hook.create()).data;
  });

  describe("unauthenticated", () => {
    it("fails", async () => {
      const ws = new WebSocket(
        `${process.env.WEB_URL!.split("http").join("ws")}/hook-events?hookId=${
          hook.id
        }`,
        { perMessageDeflate: false }
      );
      const [err] = await convertEventToPromise("error", ws);
      expect((err as Error).message).toMatch("401");
    });
  });

  describe("authenticated", () => {
    it("fails without a hook id", async () => {
      const ws = new WebSocket(
        `${process.env.WEB_URL!.split("http").join("ws")}/hook-events`,
        {
          headers: {
            cookie: cookieForCreds(api.creds),
          },
        }
      );
      const [err] = await convertEventToPromise("error", ws);
      expect((err as Error).message).toMatch("400");
    });

    it("fails without a hook id that doesn't belong", async () => {
      const ws = new WebSocket(
        `${process.env
          .WEB_URL!.split("http")
          .join("ws")}/hook-events?hookId=${randomUUID()}`,

        {
          perMessageDeflate: false,
          headers: {
            cookie: cookieForCreds(api.creds),
          },
        }
      );
      const [err] = await convertEventToPromise("error", ws);
      expect((err as Error).message).toMatch("403");
    });

    it("receives a new-request message when new request is processed", async () => {
      const ws = new WebSocket(
        `${process.env.WEB_URL!.split("http").join("ws")}/hook-events?hookId=${
          hook.id
        }`,
        {
          perMessageDeflate: false,
          headers: {
            cookie: cookieForCreds(api.creds),
          },
        }
      );
      await convertEventToPromise("upgrade", ws);
      await api.hook.update(hook.id, {
        code: "function reducer(state, request) { return {foo: 3}; }",
      });
      await api.hook.publish(hook.id);
      await allQueuesDrained();

      await api.hook.writeKey(hook.writeKeys[0], {});
      const asJson = await convertMessageEventToPromise(
        ws,
        (msg) => msg.type === "new-request"
      );
      expect(asJson).toEqual(
        expect.objectContaining({
          type: "new-request",
          hookId: hook.id,
          request: expect.objectContaining({
            state: { foo: 3 },
            stateHash: expect.any(String),
            bodyHash: expect.any(String),
          }),
        })
      );
      ws.close();
    });

    it("receives a bulk-update message after publishing a new version", async () => {
      const ws = new WebSocket(
        `${process.env.WEB_URL!.split("http").join("ws")}/hook-events?hookId=${
          hook.id
        }`,
        {
          perMessageDeflate: false,
          headers: {
            cookie: cookieForCreds(api.creds),
          },
        }
      );
      await convertEventToPromise("upgrade", ws);
      await api.hook.update(hook.id, {
        code: "function reducer(state, request) { return {foo: 3}; }",
      });
      await api.hook.publish(hook.id);
      const asJson = await convertMessageEventToPromise(
        ws,
        (msg) => msg.type === "bulk-update"
      );
      expect(asJson).toEqual(
        expect.objectContaining({
          type: "bulk-update",
          hookId: hook.id,
        })
      );
      ws.close();
    });
  });
});
