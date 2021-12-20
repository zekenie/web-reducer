import { sql } from "slonik";
import { getPool } from "../db";

export async function bulkCreateState({
  requests,
  hookId,
  versionId,
}: {
  requests: {
    id: string;
    executionTime: number;
    state: {};
    error?: { name: string; message: string; stacktrace?: string };
  }[];
  hookId: string;
  versionId: string;
}) {
  const pool = getPool();
  await pool.maybeOne(sql`
    insert into state
    (state, error, "executionTime", hash, "hookId", "requestId", "versionId")
    select * from ${sql.unnest(
      requests.map((request) => [
        sql.json(request.state),
        sql.json(request.error as {}),
        request.executionTime,
        "foobar",
        hookId,
        request.id,
        versionId,
      ]),
      ["jsonb", "jsonb", "int4", "varchar", "uuid", "uuid", "uuid"]
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
  error?: { name: string; message: string; stacktrace?: string };
  hookId: string;
  requestId: string;
  versionId: string;
  executionTime: number;
}): Promise<void> {
  const pool = getPool();
  await pool.anyFirst(sql`
      insert into state 
      (state, error, "executionTime", hash, "hookId", "requestId", "versionId")
      values
      (${state ? sql.json(state) : null}, ${
    error ? sql.json(error) : null
  }, ${executionTime}, 'hash to go here', ${hookId}, ${requestId}, ${versionId})
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
