import { sql } from "slonik";
import { getPool } from "../db";
import { runCode } from "../runner/runner.service";

import { enqueue } from "../worker/queue.service";

export async function handleRequest({
  body,
  requestId,
  contentType,
  writeKey,
}: {
  body: unknown;
  requestId: string;
  contentType: string;
  writeKey: string;
}) {
  await enqueue({
    name: "request",
    input: {
      body,
      requestId,
      contentType,
      writeKey,
    },
  });
}

export async function runHook(requestId: string): Promise<unknown> {
  const pool = getPool();
  const request = await pool.one<{
    writeKey: string;
    id: string;
    body: string;
  }>(
    sql`select "writeKey", "id", body::text from request where id = ${requestId}`
  );
  const { id, code } = await pool.one<{ code: string; id: string }>(sql`
    select id, code from hook
    join "key"
      on "key"."hookId" = hook.id
    where "key"."type" = 'write'
    and "key"."key" = ${request.writeKey}
  `);

  const { state } = await pool.one<{ state: string }>(sql`
    select state::text from request where "hookId" = ${id}
    order by "createdAt" desc
    limit 1
  `);

  const { result, ms, error } = await runCode({
    code,
    state: state,
    event: request.body,
  });

  await pool.anyFirst(sql`
    update request
    set state = ${sql.json(result as {})},
    "error" = ${sql.json(JSON.stringify(error))},
    "executionTime" = ${ms}
    where id = ${request.id}
  `);

  return false;
}
