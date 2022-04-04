import { sql } from "slonik";
import { unauthenticatedServerClient } from "./clients";
import { getPool } from "./db";
import { buildHook } from "./hook-builder";
import { allQueuesDrained } from "./server-internals";
import { testSetup } from "./setup";

describe("existing hooks", () => {
  testSetup();

  it("has a context", async () => {
    const { context } = await buildHook();
    expect(context).toEqual(
      expect.objectContaining({
        hookId: expect.any(String),
        versionId: expect.any(String),
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
      `/${context.writeKey}`,
      body1
    );
    const res2 = await unauthenticatedServerClient.post<{ id: string }>(
      `/${context.writeKey}`,
      body2
    );

    expect(res.status).toEqual(202);
    expect(res2.status).toEqual(202);
    await api.settled(res2.data.id);
  });

  it("accepts requests and eventually modifies the state", async () => {
    const body1 = { number: 4 };
    const body2 = { number: 3 };
    const { api } = await buildHook({ bodies: [body1, body2] });

    await api.settled(body2);

    const state = await api.read();

    expect(state).toEqual({ number: 7 });
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
});
