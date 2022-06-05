import { unauthenticatedServerClient } from "./clients";
import { getPool } from "./db";
import { buildAuthenticatedApi, HookDetail } from "./hook-builder";
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
        authedApi2.authenticatedClient;
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
    describe("delete", () => {
      it("rejects unauthenticated requests", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        const { status } = await unauthenticatedServerClient.delete(
          `/hooks/${hook.id}/keys/${key}`,
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
          await authedApi2.authenticatedClient.delete(
            `/hooks/${hook.id}/keys/${key}`
          );
        }).rejects.toThrow();
      });
      it("rejects requests for key that does not match hook", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        const { data: otherHook } = await authedApi.hook.create();
        const { status } = await authedApi.authenticatedClient.delete(
          `/hooks/${otherHook.id}/keys/${key}`,
          {
            validateStatus: () => true,
          }
        );
        expect(status).toEqual(404);
      });
      it("deletes key", async () => {
        const key = await authedApi.hook.addKey({
          hookId: hook.id,
          type: "read",
        });
        const { status } = await authedApi.authenticatedClient.delete(
          `/hooks/${hook.id}/keys/${key}`
        );
        expect(status).toEqual(202);
      });
    });
  });
});
