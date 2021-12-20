import { sql } from "slonik";
import { getPool } from "../db";
import { HookWorkflowState } from "./types";

type CodeToRun = {
  versionId: string;
  code: string;
  hookId: string;
};

export async function createHook() {
  const pool = getPool();
  await pool.transaction(async () => {
    const { id } = await pool.one<{ id: string }>(sql`
      insert into "hook"
      ("createdAt")
      values
      (NOW())
      returning id
    `);
    await pool.one<{ id: string }>(sql`
      insert into "version"
      ("hookId", "code", "workflowState", "createdAt", "updatedAt")
      values
      (${id}, '', ${HookWorkflowState.DRAFT}, NOW(), NOW())
      returning id
  `);
  });
}

export function getCodeByHook(hookId: string): Promise<CodeToRun> {
  const pool = getPool();
  const code = pool.one<CodeToRun>(
    sql`
      select
        version.id as "versionId",
        version."hookId" as "hookId",
        code
      from version
      where "version"."hookId" = ${hookId}
        and version."workflowState" = ${HookWorkflowState.PUBLISHED}
      limit 1
  `
  );
  return code;
}

export function getCodeByWriteKey(writeKey: string): Promise<CodeToRun> {
  const pool = getPool();
  const code = pool.one<CodeToRun>(
    sql`
      select
      version.id as "versionId",
      version."hookId" as "hookId",
      code from version
    join "key"
      on "key"."hookId" = version."hookId"
    where "key"."type" = 'write'
      and "key"."key" = ${writeKey}
      and version."workflowState" = ${HookWorkflowState.PUBLISHED}
    limit 1
  `
  );

  if (!code) {
    throw new Error("no code found with that write key");
  }
  return code;
}
