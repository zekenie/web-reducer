import { IncomingHttpHeaders } from "http";
import { sql } from "slonik";
import { getPool } from "../db";
import { WebhookRequest } from "./request.types";
import { cargoQueue } from "async";
import { captureBatchSize } from "./request.metrics";
import { InvalidWriteKeyError } from "./request.errors";
import { getPublishedCodeByHook } from "../hook/hook.db";

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
    select count(*)
    from request
    join "key"
      on request."writeKey" = "key"."key"
    where
      "key"."hookId" = ${hookId}
      and "key"."type" = 'write'
    ${after ? sql`and "request"."createdAt > ${after}` : sql``}
    -- order by "request"."createdAt" asc
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
      request.headers,
      request."createdAt"
    from request
    join "key"
      on request."writeKey" = "key"."key"
    where
      "key"."hookId" = ${hookId}
      and "key"."type" = 'write'
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
        "queryString",
        "id",
        body,
        headers,
        "createdAt"
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
    queryString: string;
  };
  writeKey: string;
};

const insertRequestCargo = cargoQueue<CaptureRequest & { hookId: string }>(
  async (requestCaptures, done) => {
    try {
      captureBatchSize.record(requestCaptures.length);
      const query = sql`
        insert into request
        ("id", "contentType", "body", "headers", "writeKey", "hookId", "queryString")
        select * from
        ${sql.unnest(
          requestCaptures.map(
            ({ id, contentType, request, writeKey, hookId }) => {
              return [
                id,
                contentType || null,
                JSON.stringify(request.body),
                JSON.stringify(request.headers),
                writeKey,
                hookId,
                request.queryString,
              ];
            }
          ),
          ["uuid", "varchar", "jsonb", "jsonb", "varchar", "uuid", "text"]
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

export async function countPendingRequests({
  hookId,
}: {
  hookId: string;
}): Promise<number> {
  const pool = getPool();
  const { versionId } = await getPublishedCodeByHook(hookId);
  const { count } = await pool.one<{ count: string }>(sql`
    select count(*)
    from "request"
    left join "state"
      on "request"."id" = "state"."requestId"
    where "state"."requestId" is null
    and "state"."versionId" = ${versionId}
  `);
  return +count;
}
