import { serialize } from "cookie";
import { randomUUID } from "crypto";
import { WebSocket } from "ws";
import { buildAuthenticatedApi, HookDetail } from "./hook-builder";
import { allQueuesDrained } from "./server-internals";
import { testSetup } from "./setup";
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

function convertEventToPromise<T>(event: string, ws: WebSocket) {
  return new Promise<T[]>((resolve) => {
    ws.on(event, (...args) => {
      resolve(args);
    });
  });
}

describe("authenticated socket", () => {
  testSetup();
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
        }`
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
          headers: {
            cookie: cookieForCreds(api.creds),
          },
        }
      );
      const [err] = await convertEventToPromise("error", ws);
      expect((err as Error).message).toMatch("403");
    });

    it("receives a message when new request is processed", async () => {
      const ws = new WebSocket(
        `${process.env.WEB_URL!.split("http").join("ws")}/hook-events?hookId=${
          hook.id
        }`,
        {
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

      const [msg]: Buffer[] = await convertEventToPromise("message", ws);
      const asJson = JSON.parse(msg.toString());
      expect(asJson).toEqual(
        expect.objectContaining({
          state: expect.objectContaining({
            state: { foo: 3 },
          }),
        })
      );
      ws.close();
    });
  });
});
