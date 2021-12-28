import { sql } from "slonik";
import { getPool } from "../db";
import { ConsoleMessage, RuntimeError } from "../runner/types";

export async function doesStateExist({
  hookId,
  requestId,
  versionId,
}: {
  versionId: string;
  requestId: string;
  hookId: string;
}): Promise<boolean> {
  const pool = getPool();
  const stateRecord = await pool.maybeOne(sql`
    select id from "state"
    where "hookId" = ${hookId} and
    "requestId" = ${requestId} and
    "versionId" = ${versionId}
  `);

  return !!stateRecord;
}

export async function readState(
  readKey: string
): Promise<{ state: unknown } | null> {
  const pool = getPool();
  return pool.maybeOne<{ state: unknown }>(sql`
    select state.state
    from state
    join "key"
      on "key"."hookId" = state."hookId"
    where
      "key"."key" = ${readKey}
      and "key"."type" = 'read'
    order by "state"."createdAt" desc
    limit 1
  `);
}

export async function isIdempotencyKeyOk(
  idempotencyKey: string,
  { hookId, versionId }: { hookId: string; versionId: string }
): Promise<boolean> {
  const pool = getPool();
  const { count } = await pool.one<{ count: number }>(sql`
    select count(*) from state
    where "hookId" = ${hookId}
      and "versionId" = ${versionId}
      and "idempotencyKey" = ${idempotencyKey}
  `);
  return count === 0;
}

export async function checkValidityOfIdempotencyKeys(
  keys: string[],
  { hookId, versionId }: { hookId: string; versionId: string }
): Promise<string[]> {
  const pool = getPool();
  const rows = await pool.many<{
    idempotencyKey: string;
    requestId: string;
  }>(sql`
    select "idempotencyKey", "requestId"
    from "state"
    where
      "hookId" = ${hookId}
      and "versionId" = ${versionId}
      and "idempotencyKey" = any(${keys})
  `);
  return rows.map((row) => row.idempotencyKey);
}

export async function bulkCreateState({
  requests,
  hookId,
  versionId,
}: {
  requests: {
    id: string;
    executionTime: number;
    console: ConsoleMessage[];
    idempotencyKey?: string;
    state: {};
    error?: RuntimeError;
  }[];
  hookId: string;
  versionId: string;
}) {
  const pool = getPool();
  await pool.maybeOne(sql`
    insert into state
    (state, error, console, "executionTime", "hookId", "requestId", "versionId")
    select * from ${sql.unnest(
      requests.map((request) => [
        sql.json(request.state),
        sql.json(request.error as {}),
        sql.json(request.console),
        request.executionTime,
        hookId,
        request.id,
        versionId,
      ]),
      ["jsonb", "jsonb", "jsonb", "int4", "uuid", "uuid", "uuid"]
    )}
  `);
}

export async function createState({
  state,
  error,
  hookId,
  requestId,
  console,
  idempotencyKey,
  versionId,
  executionTime,
}: {
  state: {};
  error?: RuntimeError;
  console: ConsoleMessage[];
  hookId: string;
  requestId: string;
  idempotencyKey?: string;
  versionId: string;
  executionTime: number;
}): Promise<void> {
  const pool = getPool();
  await pool.anyFirst(sql`
      insert into state 
      (state, error, console, "executionTime", "hookId", "requestId", "idempotencyKey", "versionId")
      values
      (${state ? sql.json(state) : null}, ${
    error ? sql.json(error) : null
  }, ${sql.json(console)}, ${executionTime}, ${hookId}, ${requestId}, ${
    idempotencyKey || null
  }, ${versionId})
    `);
}

export async function fetchState({
  hookId,
  versionId,
}: {
  hookId: string;
  versionId: string;
}): Promise<{ state: {}; requestId: string } | null> {
  const pool = getPool();
  const result = await pool.maybeOne<{ state: {}; requestId: string }>(sql`
    select state from state 
    where "hookId" = ${hookId}
    and "versionId" = ${versionId}
    order by "createdAt" desc
    limit 1
  `);
  if (!result) {
    return null;
  }
  return result;
}
