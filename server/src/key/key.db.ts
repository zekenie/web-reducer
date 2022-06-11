import { getPool } from "../db";
import { sql } from "slonik";
import { KeyWorkflowState } from "./key.types";

export async function createKey({
  type,
  hookId,
  key,
}: {
  type: "read" | "write";
  hookId: string;
  key: string;
}): Promise<void> {
  const pool = getPool();
  await pool.any(sql`
    insert into key
    ("createdAt", "type", "key", "hookId", "workflowState")
    values
    (NOW(), ${type}, ${key}, ${hookId}, 'live')
  `);
}

export async function pauseKey({
  key,
  hookId,
}: {
  key: string;
  hookId: string;
}): Promise<{ paused: boolean }> {
  const pool = getPool();
  const record = await pool.maybeOne(sql`
    update "key"
    set "workflowState" = 'paused'
    where "key" = ${key}
      and "hookId" = ${hookId}
    returning id
  `);
  return { paused: !!record };
}

export async function playKey({
  key,
  hookId,
}: {
  key: string;
  hookId: string;
}): Promise<{ played: boolean }> {
  const pool = getPool();
  const record = await pool.maybeOne(sql`
    update "key"
    set "workflowState" = 'live'
    where "key" = ${key}
      and "hookId" = ${hookId}
    returning id
  `);
  return { played: !!record };
}

export async function isReadKeyValid(readKey: string): Promise<boolean> {
  const pool = getPool();
  const row = await pool.maybeOne(sql`
    select id from "key"
    where type = 'read'
    and "key" = ${readKey}
    and "workflowState" = 'live'
  `);
  return !!row;
}

export async function getKeysForHook({
  hookId,
}: {
  hookId: string;
}): Promise<
  readonly {
    type: "read" | "write";
    key: string;
    workflowState: KeyWorkflowState;
  }[]
> {
  const pool = getPool();
  return pool.many<{
    type: "read" | "write";
    key: string;
    workflowState: KeyWorkflowState;
  }>(sql`
    select key, type, "workflowState" from "key"
    where "hookId" = ${hookId}
  `);
}
