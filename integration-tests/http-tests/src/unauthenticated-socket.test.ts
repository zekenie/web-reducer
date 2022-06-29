import { WebSocket } from "ws";
import {
  convertEventToPromise,
  convertMessageEventToPromise,
} from "./authenticated-socket.test";
import { buildAuthenticatedApi } from "./hook-builder";
import { allQueuesDrained } from "./server-internals";
import { serverTestSetup } from "./setup";

describe("unauthenticated websocket", () => {
  serverTestSetup();
  let api: Awaited<ReturnType<typeof buildAuthenticatedApi>>;
  beforeEach(async () => {
    api = await buildAuthenticatedApi();
  });

  it("fails without a readKey", async () => {
    const ws = new WebSocket(
      `${process.env.WEB_URL!.split("http").join("ws")}/state-events`,
      { perMessageDeflate: false }
    );
    const [err] = await convertEventToPromise("error", ws);
    expect((err as Error).message).toMatch("400");
  });

  it("fails without a bs read key", async () => {
    const ws = new WebSocket(
      `${process.env
        .WEB_URL!.split("http")
        .join("ws")}/state-events?readKey=asdf`,
      { perMessageDeflate: false }
    );
    const [err] = await convertEventToPromise("error", ws);
    expect((err as Error).message).toMatch("404");
  });

  it("receives a new-state message when new request is processed", async () => {
    const hook = (await api.hook.create()).data;

    await api.hook.update(hook.id, {
      code: "function reducer(state, request) { return {foo: 3}; }",
    });
    await api.hook.publish(hook.id);
    await allQueuesDrained();

    const conStr = `${process.env
      .WEB_URL!.split("http")
      .join("ws")}/state-events?readKey=${hook.readKeys[0]}`;
    const ws = new WebSocket(conStr);
    await convertEventToPromise("upgrade", ws);
    await api.hook.writeKey(hook.writeKeys[0], {});

    const asJson = await convertMessageEventToPromise(
      ws,
      (msg) => msg.type === "new-state"
    );
    expect(asJson).toEqual(
      expect.objectContaining({
        type: "new-state",
        state: { foo: 3 },
      })
    );
    ws.close();
  });

  it("works with a queryString", async () => {
    const hook = (await api.hook.create()).data;

    await api.hook.update(hook.id, {
      code: `
        function reducer() { return { number: 1 } }
        function query(state, queryParams) { return { statusCode: 200, body: { foo: queryParams.get('foo') } }; }
      `,
    });
    await api.hook.publish(hook.id);
    await allQueuesDrained();

    const conStr = `${process.env
      .WEB_URL!.split("http")
      .join("ws")}/state-events?readKey=${hook.readKeys[0]}&foo=bar`;
    const ws = new WebSocket(conStr);
    await convertEventToPromise("upgrade", ws);
    await api.hook.writeKey(hook.writeKeys[0], {});

    const asJson = await convertMessageEventToPromise(ws, (msg) => {
      console.log(msg);
      return msg.type === "new-state";
    });
    expect(asJson).toEqual(
      expect.objectContaining({
        type: "new-state",
        state: { foo: "bar" },
      })
    );
    ws.close();
  });
});
