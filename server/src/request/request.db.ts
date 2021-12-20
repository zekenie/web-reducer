import { IncomingHttpHeaders } from "http";
import { sql } from "slonik";
import { getPool } from "../db";
import { WebhookRequest } from "./types";

type RequestToRun = WebhookRequest & {
  writeKey: string;
  id: string;
};

export async function countRequestsForHook(
  hookId: string,
  after?: string
): Promise<number> {
  const pool = getPool();
  const { count } = await pool.one<{ count: number }>(sql`
    select count(request.id)
    from request
    join "writeKey"
      on request."writeKey" = "writeKey"."key"
    where
      "writeKey"."hookId" = ${hookId}
    ${after ? sql`and "id" > ${after}` : ""}
    order by "createdAt" asc
  `);
  return count;
}

export async function streamRequestsForHook(
  hookId: string,
  onRecord: (request: WebhookRequest & { id: string }) => void
): Promise<void> {
  const pool = getPool();
  await pool.stream(
    sql`
    select
      request.id,
      request.body,
      request.headers
    from request
    join "writeKey"
      on request."writeKey" = "writeKey"."key"
    where
      "writeKey"."hookId" = ${hookId}
    order by request."createdAt" asc
  `,
    (stream) => {
      stream.on(
        "data",
        (datum: {
          fields: { name: string; dataTypeId: number }[];
          row: WebhookRequest & { id: string };
        }) => {
          onRecord(datum.row);
        }
      );
    }
  );
}

export function getRequestToRun(id: string): Promise<RequestToRun> {
  const pool = getPool();
  console.log("finding request with", id);
  return pool.one<RequestToRun>(
    sql`
      select
        "writeKey",
        "id",
        body,
        headers
      from request
      where id = ${id}`
  );
}

export const captureRequest = async ({
  id,
  contentType,
  request,
  writeKey,
}: {
  id: string;
  contentType: string;
  request: {
    body: {};
    headers: IncomingHttpHeaders | Record<string, string>;
  };
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
    ("id", "contentType", "body", "headers", "writeKey", "hookId", "createdAt")
    values
    (${id}, ${contentType}, ${sql.json(request.body)}, ${sql.json(
    request.headers
  )}, ${writeKey}, ${key.hookId}, NOW())
    returning id
  `;

  const { id: requestId } = await pool.one<{ id: string }>(query);

  return { hookId: key.hookId, requestId };
};
