import { last } from "lodash";
import { sql } from "slonik";
import { getPool } from "./db";
import { buildAuthenticatedApi, buildHook } from "./hook-builder";
import { testSetup } from "./setup";

describe("existing hooks", () => {
  testSetup();

  it("only allows reading history for user with access", async () => {
    const body1 = { number: 4 };
    const body2 = { number: 3 };
    const { api, context } = await buildHook({ bodies: [body1, body2] });
    const otherUserApi = await buildAuthenticatedApi();
    await api.settled(body1);
    await api.settled(body2);

    const historyRes = await otherUserApi.hook.history(
      context.hookId,
      {},
      { validateStatus: () => true }
    );

    expect(historyRes.status).toEqual(403);
  });

  it("saves history", async () => {
    const body1 = { number: 4 };
    const body2 = { number: 3 };
    const { api } = await buildHook({ bodies: [body1, body2] });
    await api.settled(body1);
    await api.settled(body2);

    const stateHistory = await api.history();

    expect(stateHistory.nextToken).toBeFalsy();
    expect(stateHistory.objects).toHaveLength(2);

    const [state1, state2] = stateHistory.objects;

    expect(state1.state).toEqual({ number: 7 });
    expect(state1.body).toEqual(body2);
    expect(state2.state).toEqual({ number: 4 });
    expect(state2.body).toEqual(body1);

    expect(state1.createdAt).toBeGreaterThan(state2.createdAt);
  });

  it.only("`hasNext` when there are more records", async () => {
    const pool = getPool();
    const reqs = Array.from({ length: 42 }, (_, index) => ({ index }));
    const { api, context } = await buildHook<
      { index: number },
      { num: number; index: number }
    >({
      code: `function reducer(prev = { num: 0 }, { body }) { return { num: prev.num + 1, index: body.index } }`,
      bodies: reqs,
    });
    const lastReq = last(reqs)!;
    await api.settled(lastReq);

    const { count } = await pool.one<{ count: number }>(
      sql`select count(*) from state where "hookId" = ${context.hookId} and "versionId" = ${context.versionId}`
    );

    expect(count).toEqual(42);

    const historyPage = await api.history();
    expect(historyPage.nextToken).toEqual(expect.any(String));
    expect(historyPage.objects).toHaveLength(40);

    for (const stateHistory of historyPage.objects) {
      expect(stateHistory.state.index + 1).toEqual(stateHistory.state.num);
    }

    const nextHistoryPage = await api.history();

    expect(nextHistoryPage.objects).toHaveLength(2);
    expect(nextHistoryPage.nextToken).toBeFalsy();
  }, 8000);
});
