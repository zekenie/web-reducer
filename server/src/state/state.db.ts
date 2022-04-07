import { omit } from "lodash";
import { sql } from "slonik";
import { getPool } from "../db";
import { VersionWorkflowState } from "../hook/hook.types";
import {
  PaginatedTokenResponse,
  PaginationQueryArgs,
} from "../pagination/pagination.types";
import { ConsoleMessage, RuntimeError } from "../runner/runner.types";
import { generateNextToken, parseNextToken } from "./tokens";
import { StateHistory } from "./state.types";

export async function doesStateExist({
  hookId,
  requestId,
  versionId,
}: {
  versionId: string;
  requestId: string;
  hookId: string;
}): Promise<boolean> {
  const pool = getPool();
  const stateRecord = await pool.maybeOne(sql`
    select id from "state"
    where "hookId" = ${hookId} and
    "requestId" = ${requestId} and
    "versionId" = ${versionId}
  `);

  return !!stateRecord;
}

function generateSqlFilterExpressionForToken(token?: string) {
  if (!token) {
    return sql` and "request"."createdAt" < ${new Date().toISOString()} `;
  }
  const { requestId, createdAt } = parseNextToken(token);

  return sql` and ("request"."createdAt", "requestId") < (${createdAt.toISOString()}, ${requestId}) `;
}

export async function getStateHistory(
  hookId: string,
  paginationArgs: PaginationQueryArgs
): Promise<PaginatedTokenResponse<StateHistory>> {
  const pool = getPool();

  // how does this work with page 1???

  const records = await pool.many<StateHistory & { fullCount: number }>(sql`
    select
      "requestId",
      state,
      request."body",
      error,
      console,
      "request"."createdAt",
      count(*) OVER() AS "fullCount"
    from state
    join version
      on version."hookId" = state."hookId"
    join request
      on request.id = state."requestId"
    where "state"."hookId" = ${hookId}
    and version."workflowState" = ${VersionWorkflowState.PUBLISHED}
    ${generateSqlFilterExpressionForToken(paginationArgs.token)}
    order by "request"."createdAt" desc
    limit ${paginationArgs.pageSize}
  `);

  if (!records.length) {
    return {
      nextToken: null,
      objects: [],
    };
  }
  const [{ fullCount }] = records;
  const hasNext = fullCount > paginationArgs.pageSize;

  const objects = records.map((record) => omit(record, "fullCount"));

  return {
    nextToken: generateNextToken({ hasNext, objects }),
    objects,
  };
}

export async function readState(
  readKey: string
): Promise<{ state: unknown } | null> {
  const pool = getPool();
  return pool.maybeOne<{ state: unknown }>(sql`
    select state.state
    from state
    join "key"
      on "key"."hookId" = state."hookId"
    join "request"
      on "request"."id" = "state"."requestId"
    join "version"
      on "state"."versionId" = "version"."id"
    where
      "key"."key" = ${readKey}
      and "key"."type" = 'read'
      and "version"."workflowState" = 'published'
    order by "request"."createdAt" desc
    limit 1
  `);
}

export async function isIdempotencyKeyOk(
  idempotencyKey: string,
  { hookId, versionId }: { hookId: string; versionId: string }
): Promise<boolean> {
  const pool = getPool();
  const { count } = await pool.one<{ count: number }>(sql`
    select count(*) from state
    where "hookId" = ${hookId}
      and "versionId" = ${versionId}
      and "idempotencyKey" = ${idempotencyKey}
  `);
  return count === 0;
}

export async function checkValidityOfIdempotencyKeys(
  keys: string[],
  { hookId, versionId }: { hookId: string; versionId: string }
): Promise<string[]> {
  const pool = getPool();
  const rows = await pool.any<{
    idempotencyKey: string;
    requestId: string;
  }>(sql`
    select "idempotencyKey", "requestId"
    from "state"
    where
      "hookId" = ${hookId}
      and "versionId" = ${versionId}
      and "idempotencyKey" = any(${keys})
  `);
  return rows.map((row) => row.idempotencyKey);
}

export async function bulkCreateState({
  requests,
  hookId,
  versionId,
}: {
  requests: {
    id: string;
    executionTime: number;
    console: ConsoleMessage[];
    idempotencyKey?: string;
    state: {};
    error?: RuntimeError;
  }[];
  hookId: string;
  versionId: string;
}) {
  const pool = getPool();
  const res = await pool.many(sql`
    insert into state
    (state, error, console, "executionTime", "hookId", "requestId", "versionId")
    select * from ${sql.unnest(
      requests.map((request) => [
        JSON.stringify(request.state),
        JSON.stringify(request.error as {}),
        JSON.stringify(request.console),
        request.executionTime,
        hookId,
        request.id,
        versionId,
      ]),
      ["jsonb", "jsonb", "jsonb", "int4", "uuid", "uuid", "uuid"]
    )}
    returning id
  `);
}

export async function createState({
  state,
  error,
  hookId,
  requestId,
  console: theirConsole = [],
  idempotencyKey,
  versionId,
  executionTime,
}: {
  state: {};
  error?: RuntimeError;
  console?: ConsoleMessage[];
  hookId: string;
  requestId: string;
  idempotencyKey?: string;
  versionId: string;
  executionTime: number;
}): Promise<void> {
  const pool = getPool();
  await pool.anyFirst(sql`
      insert into state 
      (state, error, console, "executionTime", "hookId", "requestId", "idempotencyKey", "versionId")
      values
      (${state ? sql.json(state) : null}, ${error ? sql.json(error) : null}, ${
    theirConsole?.length ? sql.json(theirConsole) : sql.json([])
  }, ${executionTime}, ${hookId}, ${requestId}, ${
    idempotencyKey || null
  }, ${versionId})
    `);
}

export async function fetchState({
  hookId,
  versionId,
}: {
  hookId: string;
  versionId: string;
}): Promise<{ state: {}; requestId: string; createdAt: string } | null> {
  const pool = getPool();
  const result = await pool.maybeOne<{
    state: {};
    requestId: string;
    createdAt: string;
  }>(sql`
    select state, "requestId", "request"."createdAt" from state 
    join "request"
      on "request".id = "state"."requestId"
    where state."hookId" = ${hookId}
    and "versionId" = ${versionId}
    order by "request"."createdAt" desc
    limit 1
  `);
  if (!result) {
    return null;
  }
  return result;
}
