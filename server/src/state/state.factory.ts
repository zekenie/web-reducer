import { Factory } from "fishery";
import { sql } from "slonik";
import { getPool } from "../db";
import hookFactory from "../hook/hook.factory";
import requestFactory from "../request/request.factory";
import { StateRow } from "./state.types";
import crypto from "crypto";
import versionFactory from "../hook/version.factory";
import { VersionRow, VersionWorkflowState } from "../hook/hook.types";

export default Factory.define<StateRow>(({ associations, onCreate }) => {
  onCreate(async (row) => {
    if (!associations.hookId) {
      const hook = await hookFactory.create();
      row.hookId = hook.id;
    }
    if (!associations.versionId) {
      const version = await getPool().one<VersionRow>(sql`
        select * from "version"
        where "hookId" = ${row.hookId}
        and "workflowState" = ${VersionWorkflowState.PUBLISHED}
      `);
      row.versionId = version.id;
    }
    if (!associations.requestId) {
      const request = await requestFactory
        .associations({ hookId: row.hookId })
        .create();
      row.requestId = request.id;
    }
    await getPool().one(sql`
      insert into "state"
      (id, "requestId", "createdAt", "state", "hookId", "versionId", "error", "executionTime")
      values
      (
        ${row.id},
        ${row.requestId},
        ${row.createdAt.toISOString()},
        ${row.state ? sql.json(row.state) : null},
        ${row.hookId},
        ${row.versionId},
        ${row.error ? sql.json(row.error) : null},
        ${row.executionTime}
      )
      returning id
    `);
    return row;
  });
  return {
    id: crypto.randomUUID(),
    requestId: associations.requestId!,
    createdAt: new Date(),
    state: {},
    hookId: associations.hookId!,
    versionId: associations.versionId!,
    error: null,
    executionTime: 0,
  };
});
