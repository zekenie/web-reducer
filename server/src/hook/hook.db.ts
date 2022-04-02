import { keyBy, mapValues } from "lodash";
import { sql } from "slonik";
import { getPool } from "../db";
import { createKey } from "../key/key.db";
import UpdateHook from "./inputs/update-hook.input";
import { HookWorkflowState } from "./hook.types";
import { CodeNotFoundForWriteKeyError } from "./hook.errors";

type CodeToRun = {
  versionId: string;
  code: string;
  hookId: string;
};

export async function updateDraft(
  id: string,
  input: UpdateHook
): Promise<void> {
  const pool = getPool();
  await pool.any(sql`
    update version
    set code = ${input.code}
    where "workflowState" = 'draft'
      and "hookId" = ${id}
  `);
}

export async function createHook() {
  const pool = getPool();
  const { id } = await pool.one<{ id: string }>(sql`
    insert into "hook"
    ("createdAt")
    values
    (NOW())
    returning id
  `);
  await pool.one<{ id: string }>(sql`
    insert into "version"
    ("hookId", "code", "workflowState", "createdAt", "updatedAt")
    values
    (${id}, '', ${HookWorkflowState.DRAFT}, NOW(), NOW())
    returning id
  `);

  return id;
}

export async function getDraftAndPublishedCode(hookId: string): Promise<{
  [HookWorkflowState.PUBLISHED]?: string;
  [HookWorkflowState.DRAFT]: string;
}> {
  const pool = getPool();
  const versions = await pool.many<
    CodeToRun & { workflowState: HookWorkflowState }
  >(
    sql`
      select
        version.id as "versionId",
        version."hookId" as "hookId",
        version."workflowState",
        version.code
      from version
      where "version"."hookId" = ${hookId}
        and version."workflowState" in (${HookWorkflowState.PUBLISHED}, ${HookWorkflowState.DRAFT})
      limit 2
  `
  );

  return mapValues(keyBy(versions, "workflowState"), "code") as {
    [HookWorkflowState.PUBLISHED]?: string;
    [HookWorkflowState.DRAFT]: string;
  };
}

export function getPublishedCodeByHook(hookId: string): Promise<CodeToRun> {
  const pool = getPool();
  const code = pool.one<CodeToRun>(
    sql`
      select
        version.id as "versionId",
        version."hookId" as "hookId",
        code
      from version
      where "version"."hookId" = ${hookId}
        and version."workflowState" = ${HookWorkflowState.PUBLISHED}
      limit 1
  `
  );
  return code;
}

export async function getCodeByWriteKey(writeKey: string): Promise<CodeToRun> {
  const pool = getPool();
  const code = await pool.maybeOne<CodeToRun>(
    sql`
      select
        version.id as "versionId",
        version."hookId" as "hookId",
        code
      from version
      join "key"
        on "key"."hookId" = version."hookId"
      join "hook"
        on "version"."hookId" = "hook"."id"
      where "key"."type" = 'write'
        and "key"."key" = ${writeKey}
        and version."workflowState" = ${HookWorkflowState.PUBLISHED}
      limit 1
    `
  );

  if (!code) {
    throw new CodeNotFoundForWriteKeyError();
  }
  return code;
}

export async function pauseHook({ hookId }: { hookId: string }) {
  await getPool().query(sql`
    update "hook"
    set "workflowState" = 'paused'
    where "id" = ${hookId}
  `);
}

export async function unpauseHook({ hookId }: { hookId: string }) {
  await getPool().query(sql`
    update "hook"
    set "workflowState" = 'live'
    where "id" = ${hookId}
  `);
}

export async function isHookPaused({
  hookId,
}: {
  hookId: string;
}): Promise<boolean> {
  const res = await getPool().one<{ workflowState: "live" | "paused" }>(sql`
    select "workflowState"
    from "hook"
    where id = ${hookId}
  `);
  return res.workflowState === "paused";
}

export async function markPublishedVersionAsOld({
  hookId,
}: {
  hookId: string;
}) {
  await getPool().query(sql`
    update "version"
    set "workflowState" = ${HookWorkflowState.OLD}
    where "hookId" = ${hookId}
    and "workflowState" = ${HookWorkflowState.PUBLISHED}
  `);
}

export async function markDraftAsPublished({ hookId }: { hookId: string }) {
  await getPool().query(sql`
    update "version"
    set "workflowState" = ${HookWorkflowState.PUBLISHED}
    where "hookId" = ${hookId}
    and "workflowState" = ${HookWorkflowState.DRAFT}
  `);
}

export async function createDraft({ hookId }: { hookId: string }) {
  const publishedVersion = await getPublishedCodeByHook(hookId);
  await getPool().one<{ id: string }>(sql`
    insert into "version"
    ("hookId", "code", "workflowState", "createdAt", "updatedAt")
    values
    (${hookId}, ${publishedVersion.code}, ${HookWorkflowState.DRAFT}, NOW(), NOW())
    returning id
  `);
}
