import { IncomingHttpHeaders } from "http";
import { sql } from "slonik";
import { getPool } from "../db";
import { runCode } from "../runner/runner.service";

import { enqueue } from "../worker/queue.service";

export async function handleRequest({
  body,
  headers,
  requestId,
  contentType,
  writeKey,
}: {
  body: unknown;
  headers: IncomingHttpHeaders | Record<string, string>;
  requestId: string;
  contentType: string;
  writeKey: string;
}) {
  await enqueue({
    name: "request",
    input: {
      body,
      headers,
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
    headers: string;
  }>(
    sql`
      select
        "writeKey",
        "id",
        body::text,
        headers::text
      from request
      where id = ${requestId}`
  );
  const { versionId, hookId, code } = await pool.one<{
    versionId: string;
    code: string;
    hookId: string;
  }>(sql`
    select
      version.id as "versionId",
      version."hookId" as "hookId",
      code from version
    join "key"
      on "key"."hookId" = version.hookId
    where "key"."type" = 'write'
      and "key"."key" = ${request.writeKey}
      and version.workflowState = 'published'
    limit 1
  `);

  const { state } = await pool.one<{ state: string }>(sql`
    select state::text from state 
    where "hookId" = ${hookId}
    and "versionId" = ${versionId}
    order by "createdAt" desc
    limit 1
  `);

  const { result, ms, error } = await runCode({
    code,
    state: state,
    event: request.body,
    headers: request.headers,
  });

  if (error) {
    await pool.anyFirst(sql`
      update request
        set "error" = ${sql.json(error)}
    `);
  }

  if (result) {
    await pool.anyFirst(sql`
      insert into state 
      (state, hash, "hookId", "requestId", "versionId")
      values
      (${sql.json(
        state
      )}, 'hash to go here', ${hookId}, ${requestId}, ${versionId})
    `);
  }

  return false;
}
