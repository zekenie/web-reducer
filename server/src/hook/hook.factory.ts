import crypto from "crypto";
import { Factory } from "fishery";
import { sql } from "slonik";
import { getPool } from "../db";

import { HookRow, HookWorkflowState } from "./hook.types";
import versionFactory from "./version.factory";

export default Factory.define<HookRow>(({ onCreate, afterCreate }) => {
  onCreate(async (rec) => {
    return getPool().one(sql`
      insert into "hook"
      (id, "createdAt", "workflowState", "name", "secretAccessKey", "description", "requestCount")
      values
      (
        ${rec.id},
        ${rec.createdAt.toISOString()},
        ${rec.workflowState},
        ${rec.name},
        ${rec.secretAccessKey},
        ${rec.description || ""},
        ${rec.requestCount}
      )
      returning *
    `);
  });

  afterCreate(async (hook) => {
    await Promise.all([
      versionFactory.draft().associations({ hookId: hook.id }).create(),
      versionFactory.published().associations({ hookId: hook.id }).create(),
    ]);
    return hook;
  });

  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    workflowState: HookWorkflowState.LIVE,
    name: "a hook",
    secretAccessKey: crypto.randomUUID(),
    requestCount: 0,
  };
});
