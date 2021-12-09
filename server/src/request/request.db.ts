import { sql } from "slonik";
import { getPool } from "../db";

export const captureRequest = async ({
  id,
  contentType,
  body,
  writeKey,
}: {
  id: string;
  contentType: string;
  body: {};
  writeKey: string;
}) => {
  const pool = getPool();
  const key = await pool.one<{ hookId: string }>(
    sql`select "hookId" from "key" where type = 'write' and key = ${writeKey}`
  );

  if (!key) {
    throw new Error("invalid write key");
  }

  const query = sql`
    insert into request
    ("id", "contentType", "body", "writeKey", "createdAt")
    values
    (${id}, ${contentType}, ${sql.json(body)}, ${writeKey}, NOW())
    returning id
  `;

  const { id: requestId } = await pool.one<{ id: string }>(query);

  return { hookId: key.hookId, requestId };
};
