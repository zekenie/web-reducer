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
  const query = sql`
    insert into request
    ("id", "contentType", "body", "writeKey", "createdAt")
    values
    (${id}, ${contentType}, ${sql.json(body)}, ${writeKey}, NOW())
  `;

  const pool = getPool();

  await pool.query(query);
};
