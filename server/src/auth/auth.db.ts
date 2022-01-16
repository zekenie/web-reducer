import { sql } from "slonik";
import { getPool } from "../db";

export async function getUserIdByAuthNId(authNId: string): Promise<string> {
  const pool = getPool();
  const record = await pool.one<{ id: string }>(sql`
    select id from "user"
    where "authNId" = ${authNId}
  `);

  return record.id;
}
