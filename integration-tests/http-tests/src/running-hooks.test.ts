import { sql } from "slonik";
import { unauthenticatedServerClient } from "./clients";
import { getPool } from "./db";
import { buildHook } from "./hook-builder";
import { allQueuesDrained } from "./server-internals";
import { secretsTestSetup, serverTestSetup } from "./setup";

describe("existing hooks", () => {
  serverTestSetup();

  it("has a context", async () => {
    const { context } = await buildHook();
    expect(context).toEqual(
      expect.objectContaining({
        hookId: expect.any(String),
        writeKey: expect.any(String),
        readKey: expect.any(String),
      })
    );
  });

  it("enqueues", async () => {
    const { context, api } = await buildHook();
    const body1 = { number: 4 };
    const body2 = { number: 3 };
    const res = await unauthenticatedServerClient.post(
      `/write/${context.writeKey}`,
      body1
    );
    const res2 = await unauthenticatedServerClient.post<{ id: string }>(
      `/write/${context.writeKey}`,
      body2
    );

    expect(res.status).toEqual(202);
    expect(res2.status).toEqual(202);
    await api.settled(res2.data.id);
  });

  it("reads state as null when no requests have been made", async () => {
    const { api } = await buildHook();
    const state = await api.read();
    expect(state).toEqual(null);
  });

  it("accepts requests and eventually modifies the state", async () => {
    const body1 = { number: 4 };
    const body2 = { number: 3 };
    const { api } = await buildHook({ bodies: [body1, body2] });

    await api.settled(body2);

    const state = await api.read();

    expect(state).toEqual({ number: 7 });
  });

  it("works with typescript", async () => {
    const body1 = { number: 4 };
    const body2 = { number: 3 };
    const { api } = await buildHook({
      bodies: [body1, body2],
      code: `function reducer (oldState = { number: 0 }, req): { number: number } { return { number: oldState.number + req.body.number } }`,
    });

    await api.settled(body2);

    const state = await api.read();

    expect(state).toEqual({ number: 7 });
  });

  it("works with const declarations", async () => {
    const body1 = { number: 4 };
    const body2 = { number: 3 };
    const { api } = await buildHook({
      bodies: [body1, body2],
      code: `const reducer: ReducerFunction = (oldState = { number: 0 }, req): { number: number } => { return { number: oldState.number + req.body.number } }`,
    });

    await api.settled(body2);

    const state = await api.read();

    expect(state).toEqual({ number: 7 });
  });

  it("can throw an error", async () => {
    const body1 = { number: 4 };
    const { api } = await buildHook({
      bodies: [body1],
      code: `const reducer: ReducerFunction = (oldState = { number: 0 }, req): { number: number } => {
        throw new Error('this is an error');
      }`,
    });

    await api.settled(body1);

    const stateHistory = await api.history();
    const [firstReq] = stateHistory.objects;
    expect(firstReq.error).toEqual(
      expect.objectContaining({
        stacktrace: expect.any(String),
        name: "Error",
        message: "this is an error",
      })
    );
  });

  it("works with query strings", async () => {
    const { api } = await buildHook({
      code: `function reducer (oldState = { number: 0 }, req) {
        console.log(req.query.get('foo'))
        console.log(req.body)
        return { foo: req.query.get('foo'), number: oldState.number + req.body.number }
      }`,
    });
    const body = { number: 4 };
    await api.write(body, { foo: "bar" });

    await api.settled(body);

    const state = await api.read();

    expect(state).toEqual({ number: 4, foo: "bar" });
  });

  it("works when there is no code", async () => {
    const body1 = { number: 4 };
    const body2 = { number: 3 };
    const { api } = await buildHook({
      bodies: [body1, body2],
      code: "",
    });

    await api.settled(body2);

    const state = await api.read();

    expect(state).toEqual(null);
  });

  it("captures but does not process requests if hook is paused", async () => {
    const { api, context } = await buildHook();

    await getPool().query(sql`
      update "hook"
      set "workflowState" = 'paused'
      where "id" = ${context.hookId}
    `);

    await api.write({ number: 3 });
    await api.write({ number: 4 });

    await allQueuesDrained();
    const { count } = await getPool().one<{ count: number }>(sql`
      select count(*) from "request"
      where "writeKey" = ${context.writeKey}
    `);

    expect(count).toEqual(2);

    const { stateCount } = await getPool().one<{ stateCount: number }>(sql`
      select count(*) as "stateCount" from "state"
      where "hookId" = ${context.hookId}
    `);

    expect(stateCount).toEqual(0);
  });

  describe("secrets", () => {
    secretsTestSetup();
    it("can set secrets and then use them at runtime", async () => {
      const body1 = { number: 4 };
      const body2 = { number: 3 };
      const { api } = await buildHook({
        code: "function reducer (oldState = { number: 0 }, req) { return { number: Number(secrets.number) + oldState.number + req.body.number } }",
      });
      await api.setSecret("number", "3");
      await api.write(body1);
      await api.write(body2);
      await api.settled(body2);

      await allQueuesDrained();

      const state = await api.read();

      expect(state).toEqual({ number: 13 });
    });
  });
  describe("responder", () => {
    it("responds with responder function", async () => {
      const body1 = { number: 4 };
      const { api, context, authenticatedClient } = await buildHook({
        code: `
          function responder(request) {
            return {
              statusCode: 201,
              body: request.body,
            }
          }
          function reducer (oldState = { number: 0 }, req) { return { number: oldState.number + req.body.number } }
        `,
      });
      const { data, status } = await authenticatedClient.post(
        `/write/${context.writeKey}`,
        body1,
        { headers: { "Content-Type": "application/json" } }
      );

      expect(status).toEqual(201);
      expect(data).toEqual({ number: 4 });
    });

    it("respects custom headers in responder", async () => {
      const body1 = { number: 4 };
      const { api, context, authenticatedClient } = await buildHook({
        code: `
          function responder(request) {
            return {
              statusCode: 201,
              body: request.body,
              headers: {
                "X-Powered-By": "Zeke's magic"
              }
            }
          }
          function reducer (oldState = { number: 0 }, req) { return { number: oldState.number + req.body.number } }
        `,
      });
      const { headers } = await authenticatedClient.post(
        `/write/${context.writeKey}`,
        body1,
        { headers: { "Content-Type": "application/json" } }
      );

      expect(headers).toEqual(
        expect.objectContaining({
          "x-powered-by": "Zeke's magic",
        })
      );
    });

    it("does not enqueue with error status code", async () => {
      const body1 = { number: 4 };
      const { context, authenticatedClient } = await buildHook({
        code: `
          function responder(request) {
            return {
              statusCode: 400,
              body: { id: request.id }
            }
          }
          function reducer (oldState = { number: 0 }, req) { return { number: oldState.number + req.body.number } }
        `,
      });
      const { status, data } = await authenticatedClient.post(
        `/write/${context.writeKey}`,
        body1,
        {
          headers: { "Content-Type": "application/json" },
          validateStatus: () => true,
        }
      );

      console.log(data);

      expect(status).toEqual(400);

      await allQueuesDrained();
      const stateRecord = await getPool().maybeOne(sql`
        select * from "state"
        where "requestId" = ${data.id}
      `);

      expect(stateRecord).toBeNull();
    });

    it("has access to URLSearchParams in the request query", async () => {
      const body1 = { number: 4 };
      const { api, context, authenticatedClient } = await buildHook({
        code: `
          function responder(request) {
            return {
              statusCode: 201,
              body: { foo: request.query.get('bar') },
              headers: {
                "X-Powered-By": "Zeke's magic"
              }
            }
          }
          function reducer (oldState = { number: 0 }, req) { return { number: oldState.number + req.body.number } }
        `,
      });
      const { data } = await authenticatedClient.post(
        `/write/${context.writeKey}`,
        body1,
        {
          headers: { "Content-Type": "application/json" },
          params: { bar: "baz" },
        }
      );

      expect(data).toEqual({ foo: "baz" });
    });
  });
});
