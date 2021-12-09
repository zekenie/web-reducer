import { sql } from "slonik";
import { getPool } from "../db";
import { runCode } from "../vm/vm.service";
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
    body: any;
  }>(sql`select * from request where id = ${requestId}`);
  const { id, code } = await pool.one<{ code: string; id: string }>(sql`
    select id, code from hook
    join "key"
      on "key"."hookId" = hook.id
    where "key"."type" = 'write'
    and "key"."key" = ${request.writeKey}
  `);

  const { state } = await pool.one<{ state: unknown }>(sql`
    select state from request where "hookId" = ${id}
    order by "createdAt" desc
    limit 1
  `);

  const { result, ms, error } = runCode({
    code,
    state,
    event: request.body,
  });

  await pool.anyFirst(sql`
    update request
    set state = ${result},
    "error" = ${sql.json(JSON.stringify(error))},
    "executionTime" = ${ms}
    where id = ${request.id}
  `);

  return false;
}
