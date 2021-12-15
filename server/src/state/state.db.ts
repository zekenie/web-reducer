import { sql } from "slonik";
import { getPool } from "../db";

export async function createState({
  state,
  error,
  hookId,
  requestId,
  versionId,
  executionTime,
}: {
  state: {};
  error: {};
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
      (${sql.json(state)}, ${sql.json(
    error
  )}, ${executionTime}, 'hash to go here', ${hookId}, ${requestId}, ${versionId})
    `);
}

export async function fetchStateJSON({
  hookId,
  versionId,
}: {
  hookId: string;
  versionId: string;
}): Promise<string> {
  const pool = getPool();
  const { state } = await pool.one<{ state: string }>(sql`
    select state::text from state 
    where "hookId" = ${hookId}
    and "versionId" = ${versionId}
    order by "createdAt" desc
    limit 1
  `);
  return state;
}
