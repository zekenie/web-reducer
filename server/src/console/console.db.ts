import { groupBy, keyBy, mapValues, omit } from "lodash";
import { sql } from "slonik";
import { getPool } from "../db";
import {
  PaginatedTokenResponse,
  PaginationQueryArgs,
} from "../pagination/pagination.types";
import {
  ConsoleMessage,
  ConsoleMessageInsert,
  ConsoleRow,
} from "./console.types";
import { generateNextToken, parseNextToken } from "./tokens";

export async function bulkInsertConsole({
  consoleLogs,
}: {
  consoleLogs: ConsoleMessageInsert[];
}) {
  if (consoleLogs.length === 0) {
    return;
  }
  const pool = getPool();
  await pool.any(sql`
    insert into "console"
    ("stateId", "requestId", "hookId", "timestamp", "level", "messages")
    select * from ${sql.unnest(
      consoleLogs.map((consoleLog) => [
        consoleLog.stateId,
        consoleLog.requestId,
        consoleLog.hookId,
        new Date(consoleLog.timestamp).toISOString(),
        consoleLog.level,
        JSON.stringify(consoleLog.messages || []),
      ]),
      ["uuid", "uuid", "uuid", "timestamptz", "varchar", "jsonb"]
    )}
    returning id
  `);
}

function generateSqlFilterExpressionForToken(token?: string) {
  if (!token) {
    return sql` and "console"."timestamp" < ${new Date().toISOString()} `;
  }
  const { id, timestamp } = parseNextToken(token);

  return sql` and ("console"."timestamp", "id") < (${timestamp.toISOString()}, ${id}) `;
}

export async function getConsolePage({
  hookId,
  paginationArgs,
}: {
  hookId: string;
  paginationArgs: PaginationQueryArgs;
}): Promise<PaginatedTokenResponse<ConsoleRow>> {
  const pool = getPool();

  const rows = await pool.any<ConsoleRow & { fullCount: number }>(sql`
    select 
      id,
      messages,
      "requestId",
      "stateId",
      timestamp,
      level,
      count(*) OVER() AS "fullCount"
    from "console"
    where "hookId" = ${hookId}
    ${generateSqlFilterExpressionForToken(paginationArgs.token)}
    order by "console"."timestamp" desc
    limit ${paginationArgs.pageSize}
  `);

  if (!rows.length) {
    return { nextToken: null, objects: [] };
  }

  const objects = rows.map((row) => omit(row, "fullCount"));
  const [{ fullCount }] = rows;
  const hasNext = fullCount! > paginationArgs.pageSize;

  return {
    nextToken: generateNextToken({ hasNext, objects }),
    objects,
  };
}

export async function getConsoleByStateIds({
  stateIds,
}: {
  stateIds: string[];
}) {
  const consoleRecords = (
    await getPool().any<ConsoleMessage>(sql`
    select 
      messages,
      "requestId",
      "stateId",
      timestamp,
      level
    from "console"
    where "stateId" = ANY(${sql.array(stateIds, "uuid")})
  `)
  ).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }));

  return groupBy(consoleRecords, "stateId");
}

export async function getConsoleByStateId({
  stateId,
}: {
  stateId: string;
}): Promise<ConsoleMessage[]> {
  const map = await getConsoleByStateIds({ stateIds: [stateId] });
  return map[stateId] || [];
}
