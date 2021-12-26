import { serverClient } from "./clients";
import { cleanup } from "./db/cleanup";

describe("changing hooks", () => {
  afterEach(() => {
    return cleanup();
  });
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
});
