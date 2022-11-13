import { omit } from "lodash";
import { sql } from "slonik";
import { getPool } from "../db";
import { VersionWorkflowState } from "../hook/hook.types";
import {
  PaginatedTokenResponse,
  PaginationQueryArgs,
} from "../pagination/pagination.types";
import { RuntimeError } from "../runner/runner.types";
import { generateNextToken, parseNextToken } from "./tokens";
import { StateHistory } from "./state.types";
import {
  getConsoleByStateId,
  getConsoleByStateIds,
} from "../console/console.db";

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

export async function getStateHistoryForRequest({
  requestId,
}: {
  requestId: string;
}): Promise<StateHistory | null> {
  const pool = getPool();

  const res = await pool.maybeOne<
    { _stateId: string } & Omit<StateHistory, "console">
  >(sql`

    select
      state.id as "_stateId",
      state."requestId",
      state,
      request."body",
      error,
      "request"."createdAt",
      "request"."queryString",
      "request"."headers"
    from state
    join version
      on version."hookId" = state."hookId"
    join request
      on request.id = state."requestId"
    where "request"."id" = ${requestId}
    and version."workflowState" = ${VersionWorkflowState.PUBLISHED}
  `);

  if (!res) {
    return null;
  }

  const console = await getConsoleByStateId({ stateId: res?._stateId });

  return { ...res, console };
}

export async function getStateHistoryPage(
  hookId: string,
  paginationArgs: PaginationQueryArgs
): Promise<PaginatedTokenResponse<StateHistory>> {
  const pool = getPool();

  const res = await pool.query<
    Omit<StateHistory, "console"> & { _stateId: string; fullCount: number }
  >(sql`
    with "publishedVersion" as (
      select * from "version"
      where "workflowState" = ${VersionWorkflowState.PUBLISHED}
      and "hookId" = ${hookId}
    )
    select
      state.id as "_stateId",
      state."requestId",
      state,
      request."body",
      error,
      "request"."createdAt",
      "request"."queryString",
      "request"."headers",
      count(*) OVER() AS "fullCount"
    from state
    
    join request
      on request.id = state."requestId"
    join "publishedVersion"
      on "state"."versionId" = "publishedVersion"."id"
    where "state"."hookId" = ${hookId}
    and "request"."ignore" = false
    ${generateSqlFilterExpressionForToken(paginationArgs.token)}
    order by "request"."createdAt" desc
    limit ${paginationArgs.pageSize}
  `);

  const records = res.rows;

  if (!records.length) {
    return {
      nextToken: null,
      objects: [],
    };
  }

  const consoleOutput = await getConsoleByStateIds({
    stateIds: records.map((r) => r._stateId),
  });

  const [{ fullCount }] = records;
  const hasNext = fullCount > paginationArgs.pageSize;

  const objects = records.map((record) => ({
    ...omit(record, "fullCount"),
    console: consoleOutput[record._stateId] || [],
  }));

  return {
    nextToken: generateNextToken({ hasNext, objects }),
    objects,
  };
}

export async function readCurrentState(
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
      and "key"."workflowState" = 'live'
      and "version"."workflowState" = 'published'
    order by "request"."createdAt" desc
    limit 1
  `);
}

export async function readCurrentStateForHookId(
  hookId: string
): Promise<{ state: unknown } | null> {
  const pool = getPool();
  return pool.maybeOne<{ state: unknown }>(sql`
    select state.state
    from state
    join "request"
      on "request"."id" = "state"."requestId"
    join "version"
      on "state"."versionId" = "version"."id"
    where
      "state"."hookId" = ${hookId}
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
    idempotencyKey?: string;
    state: {};
    error?: RuntimeError;
  }[];
  hookId: string;
  versionId: string;
}): Promise<readonly { requestId: string; id: string }[]> {
  const pool = getPool();
  const results = await pool.many<{ id: string; requestId: string }>(sql`
    insert into state
    (state, error, "executionTime", "hookId", "requestId", "versionId")
    select * from ${sql.unnest(
      requests.map((request) => {
        return [
          JSON.stringify(request.state || null),
          JSON.stringify(request.error || null),
          request.executionTime,
          hookId,
          request.id,
          versionId,
        ];
      }),
      ["jsonb", "jsonb", "int4", "uuid", "uuid", "uuid"]
    )}
    returning id, "requestId"
  `);
  return results;
}

export async function createState({
  state,
  error,
  hookId,
  requestId,
  idempotencyKey,
  versionId,
  executionTime,
}: {
  state: {};
  error?: RuntimeError;
  hookId: string;
  requestId: string;
  idempotencyKey?: string;
  versionId: string;
  executionTime: number;
}): Promise<{ id: string }> {
  const pool = getPool();
  return pool.one<{ id: string }>(sql`
      insert into state 
      (state, error, "executionTime", "hookId", "requestId", "idempotencyKey", "versionId")
      values
      (${state ? sql.json(state) : null}, ${
    error ? sql.json(error) : null
  }, ${executionTime}, ${hookId}, ${requestId}, ${
    idempotencyKey || null
  }, ${versionId})
      returning id
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
    and "request"."ignore" is false
    order by "request"."createdAt" desc
    limit 1
  `);
  if (!result) {
    return null;
  }
  return result;
}
