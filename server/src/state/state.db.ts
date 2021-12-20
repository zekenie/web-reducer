import { sql } from "slonik";
import { getPool } from "../db";
import { RuntimeError } from "../runner/types";

export async function readState(readKey: string): Promise<unknown> {
  const pool = getPool();
  return pool.maybeOne(sql`
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

export async function bulkCreateState({
  requests,
  hookId,
  versionId,
}: {
  requests: {
    id: string;
    executionTime: number;
    state: {};
    error?: RuntimeError;
  }[];
  hookId: string;
  versionId: string;
}) {
  const pool = getPool();
  await pool.maybeOne(sql`
    insert into state
    (state, error, "executionTime", "hookId", "requestId", "versionId")
    select * from ${sql.unnest(
      requests.map((request) => [
        sql.json(request.state),
        sql.json(request.error as {}),
        request.executionTime,
        hookId,
        request.id,
        versionId,
      ]),
      ["jsonb", "jsonb", "int4", "uuid", "uuid", "uuid"]
    )}
  `);
}

export async function createState({
  state,
  error,
  hookId,
  requestId,
  versionId,
  executionTime,
}: {
  state: {};
  error?: RuntimeError;
  hookId: string;
  requestId: string;
  versionId: string;
  executionTime: number;
}): Promise<void> {
  const pool = getPool();
  await pool.anyFirst(sql`
      insert into state 
      (state, error, "executionTime", "hookId", "requestId", "versionId")
      values
      (${state ? sql.json(state) : null}, ${
    error ? sql.json(error) : null
  }, ${executionTime}, ${hookId}, ${requestId}, ${versionId})
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
