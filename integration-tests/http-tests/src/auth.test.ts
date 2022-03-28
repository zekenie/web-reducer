import { unauthenticatedServerClient } from "./clients";
import { getPool } from "./db";
import { cleanup } from "./db/cleanup";
import { buildAuthenticatedApi } from "./hook-builder";

const pool = getPool();

describe("auth", () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    return pool.end();
  });
  describe("/guest-user", () => {
    it("responds with a jwt", async () => {
      const res = await unauthenticatedServerClient.post("/auth/guest-user");
      expect(res.status).toEqual(201);
      expect(res.data).toEqual(
        expect.objectContaining({
          jwt: expect.any(String),
        })
      );
    });
  });

  describe("/signin", () => {
    it("returns requires authentication", async () => {
      const res = await unauthenticatedServerClient.post(
        "/auth/signin",
        {},
        { validateStatus: () => true }
      );
      expect(res.status).toEqual(401);
    });

    it("requires valid email in post body", async () => {
      const api = await buildAuthenticatedApi({ guest: true });
      const res = await api.auth.signin("notanemail", {
        validateStatus: () => true,
      });
      expect(res.status).toEqual(400);
    });

    it("only accepts auth token from guest user", async () => {
      const api = await buildAuthenticatedApi({ guest: false });
      const res = await api.auth.signin("email@email.com", {
        validateStatus: () => true,
      });
      expect(res.status).toEqual(403);
    });

    it("returns 200 with an empty object", async () => {
      const api = await buildAuthenticatedApi({ guest: true });
      const res = await api.auth.signin("realemail@email.com", {
        validateStatus: () => true,
      });
      expect(res.status).toEqual(200);
      expect(res.data).toEqual({});
    });

    it.todo("sends an email to the address with signin token");
  });
});
