import { serverClient } from "./clients";
import { getPool } from "./db";
import { cleanup } from "./db/cleanup";
import { buildHook } from "./hook-builder";

const pool = getPool();

describe("existing hooks", () => {
  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    return pool.end();
  });

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
    const res = await serverClient.post(`/${context.writeKey}`, body1);
    const res2 = await serverClient.post<{ id: string }>(
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
    const { api } = await buildHook([body1, body2]);

    await api.settled(body2);

    const state = await api.read();

    expect(state).toEqual({ number: 7 });
  });

  it("saves history", async () => {
    const body1 = { number: 4 };
    const body2 = { number: 3 };
    const { api } = await buildHook([body1, body2]);
    await api.settled(body2);
    const stateHistory = await api.history();

    expect(stateHistory.hasNext).toBe(false);
    expect(stateHistory.objects).toHaveLength(2);

    const [state1, state2] = stateHistory.objects;

    expect(state1.state).toEqual({ number: 7 });
    expect(state1.body).toEqual(body2);
    expect(state2.state).toEqual({ number: 4 });
    expect(state2.body).toEqual(body1);

    expect(state1.createdAt).toBeGreaterThan(state2.createdAt);
  });
});
