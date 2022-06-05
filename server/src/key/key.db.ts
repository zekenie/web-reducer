import { getPool } from "../db";
import { sql } from "slonik";

export async function createKey({
  type,
  hookId,
  key,
}: {
  type: "read" | "write";
  hookId: string;
  key: string;
}): Promise<void> {
  const pool = getPool();
  await pool.any(sql`
    insert into key
    ("createdAt", "type", "key", "hookId")
    values
    (NOW(), ${type}, ${key}, ${hookId})
  `);
}

export async function deleteKey({
  key,
  hookId,
}: {
  key: string;
  hookId: string;
}): Promise<{ deleted: boolean }> {
  const pool = getPool();
  const record = await pool.maybeOne(sql`
    delete from "key"
    where "key" = ${key}
      and "hookId" = ${hookId}
    returning id
  `);
  return { deleted: !!record };
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

export async function getKeysForHook({
  hookId,
}: {
  hookId: string;
}): Promise<readonly { type: "read" | "write"; key: string }[]> {
  const pool = getPool();
  return pool.many<{ type: "read" | "write"; key: string }>(sql`
    select key, type from "key"
    where "hookId" = ${hookId}
  `);
}
