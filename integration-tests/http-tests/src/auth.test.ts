import { sql } from "slonik";
import { unauthenticatedServerClient } from "./clients";
import { getPool } from "./db";
import { cleanup } from "./db/cleanup";
import { buildAuthenticatedApi } from "./hook-builder";
import * as serverInternals from "./server-internals";
import jwtLib from "jsonwebtoken";

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
          refreshToken: expect.any(String),
        })
      );
    });
  });

  describe("/refresh-token", () => {
    it("issues new credentials with a valid refresh token", async () => {
      const { data } = await unauthenticatedServerClient.post(
        "/auth/guest-user"
      );

      const { jwt, refreshToken } = data;

      const refreshRes = await unauthenticatedServerClient.post(
        "/auth/refresh-token",
        {
          token: refreshToken,
        },
        { headers: { authorization: jwt } }
      );

      expect(refreshRes.data).toEqual(
        expect.objectContaining({
          jwt: expect.any(String),
          refreshToken: expect.any(String),
        })
      );

      expect(refreshToken).not.toEqual(refreshRes.data.refreshToken);
      expect(jwt).not.toEqual(refreshRes.data.jwt);
    });

    it("does not honor valid tokens without jwts", async () => {
      const { data } = await unauthenticatedServerClient.post(
        "/auth/guest-user"
      );

      const { refreshToken } = data;

      const { status } = await unauthenticatedServerClient.post(
        "/auth/refresh-token",
        {
          token: refreshToken,
        },
        { validateStatus: () => true }
      );

      expect(status).toEqual(401);
    });

    it("does not not honor valid tokens with mismatched jwts", async () => {
      const { data } = await unauthenticatedServerClient.post(
        "/auth/guest-user"
      );

      const { data: dataUser2 } = await unauthenticatedServerClient.post(
        "/auth/guest-user"
      );

      const jwt = data.jwt;
      const refreshToken = dataUser2.refreshToken;

      const { status } = await unauthenticatedServerClient.post(
        "/auth/refresh-token",
        {
          token: refreshToken,
        },
        { headers: { authorization: jwt }, validateStatus: () => true }
      );
      expect(status).toEqual(400);
    });

    it("does not recognize expired tokens", async () => {
      const { data } = await unauthenticatedServerClient.post(
        "/auth/guest-user"
      );

      const { jwt, refreshToken } = data;

      await pool.query(sql`
        update "refreshToken"
        set "createdAt" = "createdAt" - '2 weeks'::interval
      `);

      const { status } = await unauthenticatedServerClient.post(
        "/auth/refresh-token",
        {
          token: refreshToken,
        },
        { headers: { authorization: jwt }, validateStatus: () => true }
      );
      expect(status).toEqual(400);
    });

    it("does not permit refresh tokens to be reused", async () => {
      const { data } = await unauthenticatedServerClient.post(
        "/auth/guest-user"
      );

      const { jwt, refreshToken } = data;

      await unauthenticatedServerClient.post(
        "/auth/refresh-token",
        {
          token: refreshToken,
        },
        { headers: { authorization: jwt } }
      );

      const { status } = await unauthenticatedServerClient.post(
        "/auth/refresh-token",
        {
          token: refreshToken,
        },
        { headers: { authorization: jwt }, validateStatus: () => true }
      );
      expect(status).toEqual(400);
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

    it("returns 200 with an empty object and sends confirmation email", async () => {
      const api = await buildAuthenticatedApi({ guest: true });
      const res = await api.auth.signin("realemail@email.com", {
        validateStatus: () => true,
      });
      expect(res.status).toEqual(200);
      expect(res.data).toEqual({});

      await serverInternals.allQueuesDrained();

      const emailsSent = await serverInternals.read(
        "wr.worker.email.succeeded"
      );
      const emailsFailed = await serverInternals.read("wr.worker.email.failed");

      expect(emailsSent).toHaveLength(1);
      expect(emailsFailed).toHaveLength(0);

      const sentEmails = await serverInternals.read("email");

      expect(sentEmails).toHaveLength(1);

      const [{ payload: email }] = sentEmails;

      expect(email).toEqual(
        expect.objectContaining({
          to: "realemail@email.com",
          template: "signin",
          locals: {
            token: expect.any(String),
            domain: expect.any(String),
          },
        })
      );
    });
  });

  describe("/validate-signin-token", () => {
    it("signs in valid token", async () => {
      const api = await buildAuthenticatedApi({ guest: true });
      await api.auth.signin("realemail@email.com");

      await serverInternals.allQueuesDrained();
      const [{ payload: email }] = await serverInternals.read("email");

      const token = email.locals.token;

      const { data } = await api.auth.validateSigninToken(token);
      expect(data.jwt).toEqual(expect.any(String));
    });

    it("rejects expired", async () => {
      const api = await buildAuthenticatedApi({ guest: true });
      await api.auth.signin("realemail@email.com", {
        validateStatus: () => true,
      });

      await serverInternals.allQueuesDrained();
      const [{ payload: email }] = await serverInternals.read("email");

      const token = email.locals.token;

      const pool = getPool();

      await pool.query(sql`
        update "signinToken"
        set "createdAt" = "createdAt" - '2 hours'::interval
      `);
      const { status } = await api.auth.validateSigninToken(token, {
        validateStatus: () => true,
      });
      expect(status).toEqual(400);
    });

    it("rejects already used", async () => {
      const api = await buildAuthenticatedApi({ guest: true });
      await api.auth.signin("realemail@email.com", {
        validateStatus: () => true,
      });

      await serverInternals.allQueuesDrained();
      const [{ payload: email }] = await serverInternals.read("email");

      const token = email.locals.token;

      await api.auth.validateSigninToken(token);

      const { status } = await api.auth.validateSigninToken(token, {
        validateStatus: () => true,
      });
      expect(status).toEqual(400);
    });

    it("rejects invalid", async () => {
      const api = await buildAuthenticatedApi({ guest: true });

      const { status } = await api.auth.validateSigninToken("bs", {
        validateStatus: () => true,
      });
      expect(status).toEqual(400);
    });

    it("merges access from guest user to authenticated user", async () => {
      const api = await buildAuthenticatedApi({ guest: true });
      const { data: hookData } = await api.hook.create();
      const { data: hookData2 } = await api.hook.create();
      await api.auth.signin("realemail@email.com");
      await serverInternals.allQueuesDrained();
      const [{ payload: email }] = await serverInternals.read("email");

      const token = email.locals.token;

      const { data: signinRes } = await api.auth.validateSigninToken(token);
      const signedInUserId = jwtLib.decode(signinRes.jwt)?.sub;
      const pool = getPool();

      const accessRecords = await pool.many(sql`select * from "access"`);

      expect(accessRecords).toHaveLength(2);
      // const [access1, access2] = accessRecords;
      expect(accessRecords).toContainEqual(
        expect.objectContaining({
          hookId: hookData.id,
          userId: signedInUserId,
        })
      );

      expect(accessRecords).toContainEqual(
        expect.objectContaining({
          hookId: hookData2.id,
          userId: signedInUserId,
        })
      );
    });

    it.todo("works with existing user");
  });
});
