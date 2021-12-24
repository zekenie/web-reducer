import { serverClient, runnerClient } from "./clients";

describe("server", () => {
  it("has heartbeat", async () => {
    const res = await serverClient.get("/heartbeat");
    expect(res.data).toEqual({ ok: true });
  });
});

describe("runner", () => {
  it("has heartbeat", async () => {
    const res = await runnerClient.get("/heartbeat");
    expect(res.data).toEqual({ ok: true });
  });
});
