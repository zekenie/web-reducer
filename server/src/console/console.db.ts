import { groupBy, keyBy, mapValues } from "lodash";
import { sql } from "slonik";
import { getPool } from "../db";
import { ConsoleMessage, ConsoleMessageInsert } from "./console.types";

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
    ("stateId", "requestId", "timestamp", "level", "messages")
    select * from ${sql.unnest(
      consoleLogs.map((consoleLog) => [
        consoleLog.stateId,
        consoleLog.requestId,
        new Date(consoleLog.timestamp).toISOString(),
        consoleLog.level,
        JSON.stringify(consoleLog.messages || []),
      ]),
      ["uuid", "uuid", "timestamptz", "varchar", "jsonb"]
    )}
    returning id
  `);
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
}): Promise<ConsoleMessageInsert[]> {
  const map = await getConsoleByStateIds({ stateIds: [stateId] });
  return map[stateId] || [];
}
