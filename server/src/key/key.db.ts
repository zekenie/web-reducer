import { getPool } from "../db";
import { sql } from "slonik";
import { nanoid } from "nanoid/async";

export async function createKey({
  type,
  hookId,
}: {
  type: "read" | "write";
  hookId: string;
}): Promise<string> {
  const pool = getPool();
  const key = await nanoid();
  await pool.any(sql`
    insert into key
    ("createdAt", "type", "key", "hookId")
    values
    (NOW(), ${type}, ${key}, ${hookId})
  `);

  return key;
}
