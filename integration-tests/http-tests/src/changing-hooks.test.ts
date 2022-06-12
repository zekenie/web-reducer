import { sql } from "slonik";
import { unauthenticatedServerClient } from "./clients";
import { getPool } from "./db";
import { buildAuthenticatedApi, HookDetail } from "./hook-builder";
import { allQueuesDrained } from "./server-internals";
import { serverTestSetup } from "./setup";

const pool = getPool();

describe("changing hooks", () => {
  serverTestSetup();
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

  describe("changing keys", () => {
    let hook: HookDetail;
    let authedApi: Awaited<ReturnType<typeof buildAuthenticatedApi>>;
    beforeEach(async () => {
      authedApi = await buildAuthenticatedApi();
      const { data } = await authedApi.hook.create();
      hook = data;
    });

    describe("get keys", () => {
      it("rejects unauthenticated requests", async () => {
        const { status } = await unauthenticatedServerClient.get(
          `/hooks/${hook.id}/keys`,
          {
            validateStatus: () => true,
          }
        );
        expect(status).toEqual(401);
      });
      it("rejects requests from users who lack access to hook", async () => {
        const authedApi2 = await buildAuthenticatedApi();
        const { status } = await authedApi2.authenticatedClient.get(
          `/hooks/${hook.id}/keys`,
          {
            validateStatus: () => true,
          }
        );
        expect(status).toEqual(403);
      });
      it("lists hooks, even those that are paused", async () => {
        const beforeAdding = await authedApi.hook.getKeys({ hookId: hook.id });
        expect(beforeAdding).toHaveLength(2);
        await authedApi.hook.addKey({ hookId: hook.id, type: "read" });
        await authedApi.hook.addKey({ hookId: hook.id, type: "read" });
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "write",
        });
        const firstGet = await authedApi.hook.getKeys({ hookId: hook.id });
        expect(firstGet).toHaveLength(5);
        await authedApi.hook.pauseKey({ hookId: hook.id, key });
        const secondGet = await authedApi.hook.getKeys({ hookId: hook.id });
        expect(secondGet).toHaveLength(5);
        expect(secondGet).toContainEqual(
          expect.objectContaining({
            key,
            workflowState: "paused",
          })
        );
      });
    });

    describe("create", () => {
      it("rejects unauthenticated requests", async () => {
        const { status } = await unauthenticatedServerClient.post(
          `/hooks/${hook.id}/keys`,
          null,
          {
            validateStatus: () => true,
          }
        );
        expect(status).toEqual(401);
      });
      it("rejects requests from users who lack access to hook", async () => {
        const authedApi2 = await buildAuthenticatedApi();
        const { status } = await authedApi2.authenticatedClient.post(
          `/hooks/${hook.id}/keys`,
          null,
          {
            validateStatus: () => true,
          }
        );
        expect(status).toEqual(403);
      });
      it("rejects keys of disallowed types", async () => {
        expect(
          async () =>
            await authedApi.hook.addKey({ hookId: hook.id, type: "foo" })
        ).rejects.toThrow();
      });
      it("creates read key and returns it", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        expect(key).toEqual(expect.any(String));
      });
      it("creates write key and returns it", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "write",
        });
        expect(key).toEqual(expect.any(String));
      });
    });
    describe("pause", () => {
      it("rejects unauthenticated requests", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        const { status } = await unauthenticatedServerClient.post(
          `/hooks/${hook.id}/keys/${key}/pause`,
          null,
          {
            validateStatus: () => true,
          }
        );
        expect(status).toEqual(401);
      });
      it("rejects requests from users who lack access to hook", async () => {
        const authedApi2 = await buildAuthenticatedApi();
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        expect(async () => {
          await authedApi2.authenticatedClient.post(
            `/hooks/${hook.id}/keys/${key}/pause`
          );
        }).rejects.toThrow();
      });
      it("rejects requests for key that does not match hook", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        const { data: otherHook } = await authedApi.hook.create();
        const { status } = await authedApi.authenticatedClient.post(
          `/hooks/${otherHook.id}/keys/${key}/pause`,
          null,
          {
            validateStatus: () => true,
          }
        );
        expect(status).toEqual(404);
      });
      it("pauses key", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        const { status } = await authedApi.authenticatedClient.post(
          `/hooks/${hook.id}/keys/${key}/pause`
        );
        expect(status).toEqual(202);
      });

      it("hides readKeys that are paused", async () => {
        const [readKey] = hook.readKeys;
        await authedApi.hook.readKey(readKey);

        await authedApi.hook.pauseKey({ hookId: hook.id, key: readKey });

        const { status } = await authedApi.hook.readKey(readKey, {
          validateStatus: () => true,
        });

        expect(status).toEqual(404);
      });

      it("makes writeKey calls a noop", async () => {
        const [writeKey] = hook.writeKeys;
        await authedApi.hook.writeKey(writeKey, {});

        await authedApi.hook.pauseKey({ hookId: hook.id, key: writeKey });

        const { data } = await authedApi.hook.writeKey(writeKey, {});
        await allQueuesDrained();
        const stateRecord = await getPool().maybeOne(sql`
          select * from "state"
          where "requestId" = ${data.id}
        `);

        expect(stateRecord).toBeNull();
      });
    });

    describe("play", () => {
      it("rejects unauthenticated requests", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        const { status } = await unauthenticatedServerClient.post(
          `/hooks/${hook.id}/keys/${key}/play`,
          null,
          {
            validateStatus: () => true,
          }
        );
        expect(status).toEqual(401);
      });
      it("rejects requests from users who lack access to hook", async () => {
        const authedApi2 = await buildAuthenticatedApi();
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        expect(async () => {
          await authedApi2.authenticatedClient.post(
            `/hooks/${hook.id}/keys/${key}/play`
          );
        }).rejects.toThrow();
      });
      it("rejects requests for key that does not match hook", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        const { data: otherHook } = await authedApi.hook.create();
        const { status } = await authedApi.authenticatedClient.post(
          `/hooks/${otherHook.id}/keys/${key}/play`,
          null,
          {
            validateStatus: () => true,
          }
        );
        expect(status).toEqual(404);
      });
      it("resumes key", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        const { status } = await authedApi.authenticatedClient.post(
          `/hooks/${hook.id}/keys/${key}/play`
        );
        expect(status).toEqual(202);
      });

      it("allows readKeys that were paused to work", async () => {
        const [readKey] = hook.readKeys;

        await authedApi.hook.pauseKey({ hookId: hook.id, key: readKey });
        await authedApi.hook.playKey({ hookId: hook.id, key: readKey });

        const { status } = await authedApi.hook.readKey(readKey);

        expect(status).toEqual(200);
      });

      it("allow writeKeys that were paused to work", async () => {
        const [writeKey] = hook.writeKeys;

        await authedApi.hook.pauseKey({ hookId: hook.id, key: writeKey });
        await authedApi.hook.playKey({ hookId: hook.id, key: writeKey });

        const { data } = await authedApi.hook.writeKey(writeKey, {});
        await allQueuesDrained();
        const stateRecord = await getPool().maybeOne(sql`
          select * from "state"
          where "requestId" = ${data.id}
        `);

        expect(stateRecord).not.toBeNull();
      });
    });
  });
});
