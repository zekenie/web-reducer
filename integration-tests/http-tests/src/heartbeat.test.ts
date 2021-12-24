import { serverClient } from "./clients";

describe("server", () => {
  it("has heartbeat", async () => {
    const res = await serverClient.get("/heartbeat");
    expect(res.data).toEqual({ ok: true });
  });
});
