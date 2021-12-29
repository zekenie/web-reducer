import { serverClient } from "./clients";
import { getPool } from "./db";
import { cleanup } from "./db/cleanup";

const pool = getPool();

describe("changing hooks", () => {
  afterEach(async () => {
    return cleanup();
  });
  afterAll(() => pool.end());
  it("successfully creates a hook", async () => {
    const res = await serverClient.post("/hooks");
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
    const res = await serverClient.post("/hooks");
    expect(res.status).toEqual(201);

    const updateRes = await serverClient.put(`/hooks/${res.data.hookId}`, {
      code: "function reducer() { console.log('foo'); }",
    });

    expect(updateRes.status).toEqual(200);

    const readReq = await serverClient.get(`/hooks/${res.data.hookId}`);

    expect(readReq.data.draft).toEqual(
      "function reducer() { console.log('foo'); }"
    );
    expect(readReq.data.published).toBeUndefined();
  });
});
