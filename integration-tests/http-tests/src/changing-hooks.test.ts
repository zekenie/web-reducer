import { getPool } from "./db";
import { buildAuthenticatedApi } from "./hook-builder";
import { testSetup } from "./setup";

const pool = getPool();

describe("changing hooks", () => {
  testSetup();
  it("successfully creates a hook", async () => {
    const authedApi = await buildAuthenticatedApi();
    const res = await authedApi.hook.createHook();
    expect(res.status).toEqual(201);
    expect(res.data).toEqual(
      expect.objectContaining({
        hookId: expect.any(String),
        readKey: expect.any(String),
        writeKey: expect.any(String),
      })
    );
  });

  it("can update a hook", async () => {
    const authedApi = await buildAuthenticatedApi();
    const res = await authedApi.hook.createHook();
    expect(res.status).toEqual(201);

    const updateRes = await authedApi.hook.updateHook(res.data.hookId, {
      code: "function reducer() { console.log('foo'); }",
    });

    expect(updateRes.status).toEqual(200);

    const readReq = await authedApi.hook.readHook(res.data.hookId);

    expect(readReq.data.draft).toEqual(
      "function reducer() { console.log('foo'); }"
    );
    expect(readReq.data.published).toBeUndefined();
  });

  it("does not permit changing hooks without access", async () => {
    const authedApi = await buildAuthenticatedApi();
    const authedApi2 = await buildAuthenticatedApi();

    const res = await authedApi.hook.createHook();
    expect(res.status).toEqual(201);

    const updateRes = await authedApi2.hook.updateHook(
      res.data.hookId,
      {
        code: "function reducer() { console.log('foo'); }",
      },
      { validateStatus: () => true }
    );

    expect(updateRes.status).toEqual(401);
  });
});
