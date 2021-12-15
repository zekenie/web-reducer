import { sql } from "slonik";
import { getPool } from "../db";

type CodeToRun = {
  versionId: string;
  code: string;
  hookId: string;
};

export function getCode(writeKey: string): Promise<CodeToRun> {
  const pool = getPool();
  const code = pool.one<CodeToRun>(
    sql`
      select
      version.id as "versionId",
      version."hookId" as "hookId",
      code from version
    join "key"
      on "key"."hookId" = version.hookId
    where "key"."type" = 'write'
      and "key"."key" = ${writeKey}
      and version.workflowState = 'published'
    limit 1
  `
  );
  if (!code) {
    throw new Error("no code found with that write key");
  }
  return code;
}
