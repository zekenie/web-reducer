import { getPool } from "./db";
import { buildAuthenticatedApi } from "./hook-builder";
import { testSetup } from "./setup";

const pool = getPool();

describe("changing hooks", () => {
  testSetup();
  it("successfully creates a hook", async () => {
    const authedApi = await buildAuthenticatedApi();
    const res = await authedApi.hook.create();
    expect(res.status).toEqual(201);
    expect(res.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        readKeys: [expect.any(String)],
        writeKeys: [expect.any(String)],
        workflowState: "live",
      })
    );
  });

  it("can update a hook", async () => {
    const authedApi = await buildAuthenticatedApi();
    const res = await authedApi.hook.create();
    expect(res.status).toEqual(201);

    const updateRes = await authedApi.hook.update(res.data.id, {
      code: "function reducer() { console.log('foo'); }",
    });

    expect(updateRes.status).toEqual(200);

    const readReq = await authedApi.hook.read(res.data.id);

    expect(readReq.data.draft).toEqual(
      "function reducer() { console.log('foo'); }"
    );
    expect(readReq.data.published).toEqual("");
  });

  it("does not permit changing hooks without access", async () => {
    const authedApi = await buildAuthenticatedApi();
    const authedApi2 = await buildAuthenticatedApi();

    const res = await authedApi.hook.create();
    expect(res.status).toEqual(201);

    const updateRes = await authedApi2.hook.update(
      res.data.id,
      {
        code: "function reducer() { console.log('foo'); }",
      },
      { validateStatus: () => true }
    );

    expect(updateRes.status).toEqual(403);
  });
});
