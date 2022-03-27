import { unauthenticatedServerClient, runnerClient } from "./clients";

describe("server", () => {
  it("has heartbeat", async () => {
    const res = await unauthenticatedServerClient.get("/heartbeat");
    expect(res.data).toEqual({ ok: true });
  });
});

describe("runner", () => {
  it("has heartbeat", async () => {
    const res = await runnerClient.get("/heartbeat");
    expect(res.data).toEqual({ ok: true });
  });
});
