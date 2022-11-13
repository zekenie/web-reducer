import { Factory } from "fishery";
import { sql } from "slonik";
import { getPool } from "../db";
import stateFactory from "../state/state.factory";
import { ConsoleRow } from "./console.types";
import crypto from "crypto";

export default Factory.define<ConsoleRow>(
  ({ associations, onCreate, params }) => {
    onCreate(async (row) => {
      if (!row.stateId) {
        const state = await stateFactory.create();
        row.stateId = state.id;
        row.requestId = state.requestId;
      }
      await getPool().one(sql`
      insert into "console"
      (id, "level", messages, "timestamp", "requestId", "stateId")
      values
      (
        ${row.id},
        ${row.level},
        ${sql.jsonb(row.messages)},
        ${row.timestamp.toISOString()},
        ${row.requestId!},
        ${row.stateId!}
      )
      returning id
    `);
      return row;
    });
    return {
      id: crypto.randomUUID(),
      level: "log",
      messages: params.messages || [],
      timestamp: new Date(),
      requestId: associations.requestId,
      stateId: associations.stateId,
    } as ConsoleRow;
  }
);
