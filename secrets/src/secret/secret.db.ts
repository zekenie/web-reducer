import { sql } from "slonik";
import { getPool } from "../db";

export async function saveSecret({
  namespaceId,
  encryptedKey,
  encryptedValue,
}: {
  namespaceId: string;
  encryptedKey: string;
  encryptedValue: string;
}): Promise<void> {
  const pool = getPool();
  await pool.one(sql`
    insert into "secret"
    ("namespaceId", "key", "value")
    values
    (${namespaceId}, ${encryptedKey}, ${encryptedValue})
    returning id
  `);
}

export async function deleteExistingKey({
  namespaceId,
  secretId,
}: {
  namespaceId: string;
  secretId: string;
}): Promise<number> {
  const pool = getPool();
  const { rowCount } = await pool.query(sql`
    delete from "secret"
    where "namespaceId" = ${namespaceId}
    and "id" = ${secretId}
  `);
  return rowCount;
}

export async function getSecretsForNamespace({
  namespaceId,
}: {
  namespaceId: string;
}): Promise<
  readonly { id: string; encryptedKey: string; encryptedValue: string }[]
> {
  const pool = getPool();
  const { rows } = await pool.query<{
    id: string;
    encryptedKey: string;
    encryptedValue: string;
  }>(sql`
    select 
      "id",
      "key" as "encryptedKey",
      "value" as "encryptedValue"
    from "secret"
    where "namespaceId" = ${namespaceId}
  `);

  return rows;
}
