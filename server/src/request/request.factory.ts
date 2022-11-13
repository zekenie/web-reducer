import { Factory } from "fishery";
import hookFactory from "../hook/hook.factory";
import stateFactory from "../state/state.factory";
import { RequestRow } from "./request.types";
import crypto from "crypto";
import { getPool } from "../db";
import { sql } from "slonik";

class RequestFactory extends Factory<RequestRow, { processed: boolean }> {
  enqueued() {
    return this.transient({
      processed: false,
    });
  }

  processed() {
    return this.transient({
      processed: true,
    });
  }
}

export default RequestFactory.define(
  ({ associations, onCreate, afterCreate, transientParams }) => {
    onCreate(async (req) => {
      if (!associations.hookId) {
        const hook = await hookFactory.create();
        req.hookId = hook.id;
      }
      await getPool().one(sql`
        insert into "request"
        (id, "contentType", "body", "headers", "ignore", "writeKey", "createdAt", "hookId")
        values
        (
          ${req.id},
          ${req.contentType},
          ${req.body ? sql.json(req.body) : null},
          ${sql.json(req.headers)},
          ${req.ignore},
          ${req.writeKey},
          ${req.createdAt.toISOString()},
          ${req.hookId}
        )
        returning id
      `);
      return req;
    });

    afterCreate(async (req) => {
      if (transientParams.processed) {
        await stateFactory
          .associations({ requestId: req.id, hookId: req.hookId })
          .create();
      }
      return req;
    });
    return {
      id: crypto.randomUUID(),
      contentType: "application/json",
      body: { foo: "bar" },
      headers: { "content-type": "application/json" },
      ignore: false,
      writeKey: associations.writeKey! || crypto.randomBytes(4).toString(),
      createdAt: new Date(),
      hookId: associations.hookId!,
    };
  }
);
