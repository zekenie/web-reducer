import { getPool } from "../db";
import { sql } from "slonik";
import { generateToken } from "../token/token.service";

export async function createKey({
  type,
  hookId,
}: {
  type: "read" | "write";
  hookId: string;
}): Promise<string> {
  const pool = getPool();
  const key = await generateToken();
  await pool.any(sql`
    insert into key
    ("createdAt", "type", "key", "hookId")
    values
    (NOW(), ${type}, ${key}, ${hookId})
  `);

  return key;
}

export async function isReadKeyValid(readKey: string): Promise<boolean> {
  const pool = getPool();
  const row = await pool.maybeOne(sql`
    select id from "key"
    where type = 'read'
    and "key" = ${readKey}
  `);
  return !!row;
}
