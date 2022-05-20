import { sql } from "slonik";
import { getPool } from "../db";

export async function createNamespace({
  encryptedSecret,
  accessKey,
}: {
  encryptedSecret: string;
  accessKey: string;
}): Promise<string> {
  const pool = getPool();
  // const accessKey = await generateToken();
  // const encryptionKey = await generateToken();
  const { id } = await pool.one<{ id: string }>(sql`
    insert into "namespace"
    ("accessKeyHash", "encryptionKey")
    values
    (encode(sha256(${accessKey}::bytea), 'hex'), ${encryptedSecret})
    returning id
  `);
  return id;
}

export async function deleteNamespace({ accessKey }: { accessKey: string }) {
  await getPool().one(sql`
    delete from "namespace"
    where "accessKeyHash" = encode(sha256(${accessKey}::bytea), 'hex')
    returning id
  `);
}

export async function getEncryptedSecretForNamespace({
  accessKey,
}: {
  accessKey: string;
}) {
  const { encryptedSecret, id } = await getPool().one<{
    encryptedSecret: string;
    id: string;
  }>(sql`
    select "encryptionKey" as "encryptedSecret", "id"
    from "namespace"
    where "accessKeyHash" = encode(sha256(${accessKey}::bytea), 'hex')
    limit 1
  `);

  return { encryptedSecret, id };
}
