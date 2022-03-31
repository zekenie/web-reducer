import { IncomingHttpHeaders } from "http";
import { sql } from "slonik";
import { getPool } from "../db";
import { WebhookRequest } from "./request.types";
import { cargoQueue } from "async";
import { captureBatchSize } from "./request.metrics";
import { InvalidWriteKeyError } from "./request.errors";

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

export function getRequestToRun(id: string): Promise<RequestToRun | null> {
  const pool = getPool();
  return pool.maybeOne<RequestToRun>(
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

export type CaptureRequest = {
  id: string;
  contentType: string;
  request: {
    body: {};
    headers: IncomingHttpHeaders | Record<string, string>;
  };
  writeKey: string;
};

const insertRequestCargo = cargoQueue<CaptureRequest & { hookId: string }>(
  async (requestCaptures, done) => {
    try {
      captureBatchSize.record(requestCaptures.length);
      const query = sql`
        insert into request
        ("id", "contentType", "body", "headers", "writeKey", "hookId")
        select * from
        ${sql.unnest(
          requestCaptures.map(
            ({ id, contentType, request, writeKey, hookId }) => {
              return [
                id,
                contentType,
                JSON.stringify(request.body),
                JSON.stringify(request.headers),
                writeKey,
                hookId,
              ];
            }
          ),
          ["uuid", "varchar", "jsonb", "jsonb", "varchar", "uuid"]
        )}
      `;
      const pool = getPool();
      await pool.query(query);
      done();
    } catch (e) {
      done(e as Error);
    }
  },
  2,
  100
);

insertRequestCargo.error((err, task) => {
  console.error("error with cargo queue", err, task);
});

export const captureRequest = async ({
  id,
  contentType,
  request,
  writeKey,
}: CaptureRequest) => {
  const pool = getPool();
  const key = await pool.maybeOne<{ hookId: string }>(
    sql`select "hookId" from "key" where type = 'write' and key = ${writeKey}`
  );

  if (!key) {
    throw new InvalidWriteKeyError();
  }

  await insertRequestCargo.pushAsync({
    hookId: key.hookId,
    contentType,
    id,
    writeKey,
    request,
  });

  return { hookId: key.hookId, requestId: id };
};
