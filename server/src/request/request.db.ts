import { IncomingHttpHeaders } from "http";
import { sql } from "slonik";
import { getPool } from "../db";

type RequestToRun = {
  writeKey: string;
  id: string;
  body: string;
  headers: string;
};

export function getRequestToRun(id: string): Promise<RequestToRun> {
  const pool = getPool();
  return pool.one<RequestToRun>(
    sql`
      select
        "writeKey",
        "id",
        body::text,
        headers::text
      from request
      where id = ${id}`
  );
}

export const captureRequest = async ({
  id,
  contentType,
  body,
  headers,
  writeKey,
}: {
  id: string;
  contentType: string;
  body: {};
  headers: IncomingHttpHeaders | Record<string, string>;
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
    ("id", "contentType", "body", "headers", "writeKey", "createdAt")
    values
    (${id}, ${contentType}, ${sql.json(body)}, ${sql.json(
    headers
  )}, ${writeKey}, NOW())
    returning id
  `;

  const { id: requestId } = await pool.one<{ id: string }>(query);

  return { hookId: key.hookId, requestId };
};
