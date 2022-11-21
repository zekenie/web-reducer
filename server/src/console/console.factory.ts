import { Factory } from "fishery";
import { sql } from "slonik";
import { getPool } from "../db";
import { ConsoleRow } from "./console.types";
import crypto from "crypto";
import hookFactory from "../hook/hook.factory";
import stateFactory from "../state/state.factory";

export default Factory.define<ConsoleRow, { withState: boolean }>(
  ({ associations, onCreate, params, transientParams }) => {
    onCreate(async (row) => {
      if (transientParams.withState && !row.stateId) {
        const state = await stateFactory.create();
        row.stateId = state.id;
        row.requestId = state.requestId;
      }
      if (!row.hookId) {
        const hook = await hookFactory.create();
        row.hookId = hook.id;
      }
      await getPool().one(sql`
      insert into "console"
      (id, "level", messages, "timestamp", "requestId", "stateId", "hookId")
      values
      (
        ${row.id},
        ${row.level},
        ${sql.jsonb(row.messages)},
        ${row.timestamp.toISOString()},
        ${row.requestId! || null},
        ${row.stateId! || null},
        ${row.hookId}
      )
      returning id
    `);
      return row;
    });
    return {
      id: crypto.randomUUID(),
      level: "log",
      messages: params.messages || [],
      timestamp: params.timestamp || new Date(Date.now()),
      requestId: associations.requestId,
      stateId: associations.stateId,
      hookId: associations.hookId,
    } as ConsoleRow;
  }
);
