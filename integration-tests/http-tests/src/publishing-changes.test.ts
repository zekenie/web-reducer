import { sql } from "slonik";
import { unauthenticatedServerClient } from "./clients";
import { getPool } from "./db";
import { buildAuthenticatedApi, buildHook } from "./hook-builder";
import { allQueuesDrained } from "./server-internals";
import { serverTestSetup } from "./setup";

describe("/publish", () => {
  serverTestSetup();
  describe("as an unauthenticated client", () => {
    it("should reject requests", async () => {
      const { context } = await buildHook();
      const { status } = await unauthenticatedServerClient.post(
        `/hooks/${context.hookId}/publish`,
        undefined,
        {
          validateStatus: () => true,
        }
      );
      expect(status).toEqual(401);
    });
  });
  describe("as an authenticated client who does not have access", () => {
    it("should reject the request", async () => {
      const { context } = await buildHook();
      const otherUserAuthenticatedApi = await buildAuthenticatedApi();

      const { status } = await otherUserAuthenticatedApi.hook.publish(
        context.hookId,
        { validateStatus: () => true }
      );
      expect(status).toEqual(403);
    });
  });

  describe("as a properly authenticated client", () => {
    it.todo("pauses request execution");
    it.todo(
      "marks current version as old, current draft as published and creates a new draft"
    );
    it("bulk processes existing requests", async () => {
      const bodies = [{ number: 4 }, { number: 4 }];
      const { api, context } = await buildHook({
        bodies,
      });
      await api.settled(bodies[0]);
      await api.settled(bodies[1]);
      const stateBeforeUpdate = await api.read();

      await api.update({
        code: `function reducer(oldState = { number: 0 }, req) {
          console.log(oldState);
          console.log(req);
          return { number: oldState.number + 1 };
        }`,
      });

      expect(stateBeforeUpdate).toEqual({ number: 8 });

      const stateAfterUpdateButBeforePublish = await api.read();
      expect(stateAfterUpdateButBeforePublish).toEqual({ number: 8 });

      await api.publish();
      await allQueuesDrained();

      const stateAfterPublish = await api.read();

      expect(stateAfterPublish).toEqual({ number: 2 });
    });

    it("sets the new draft to equal the latest published draft", async () => {
      const { api, context } = await buildHook({});

      const code = `function reducer(oldState = { number: 0 }, req) {
        console.log(oldState);
        console.log(req);
        return { number: oldState.number + 1 };
      }`;

      await api.update({
        code,
      });

      await api.publish();
      await allQueuesDrained();
      const hook = await api.hookDetails();

      expect(hook.draft).toEqual(code);
    });

    it("bulk processes existing requests with a code change throwing an error", async () => {
      const bodies = [{ number: 4 }, { number: 4 }];
      const { api, context } = await buildHook({
        bodies,
      });
      await api.settled(bodies[0]);
      await api.settled(bodies[1]);
      const stateBeforeUpdate = await api.read();

      await api.update({
        code: `function reducer(oldState = { number: 0 }, req) {
          throw new Error('this is an error')
          console.log(oldState);
          console.log(req);
          return { number: oldState.number + 1 };
        }`,
      });

      expect(stateBeforeUpdate).toEqual({ number: 8 });

      const stateAfterUpdateButBeforePublish = await api.read();
      expect(stateAfterUpdateButBeforePublish).toEqual({ number: 8 });

      await api.publish();
      await allQueuesDrained();

      const stateAfterPublish = await api.read();

      expect(stateAfterPublish).toEqual(null);

      const stateHistory = await api.history();
      const [firstReq] = stateHistory.objects;
      expect(firstReq.error).toEqual(
        expect.objectContaining({
          stacktrace: expect.any(String),
          name: "Error",
          message: "this is an error",
        })
      );
    });

    it.todo("resumes request execution");
  });
});
