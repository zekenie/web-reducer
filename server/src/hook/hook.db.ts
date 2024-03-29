import { keyBy, mapValues } from "lodash";
import { sql } from "slonik";
import { getPool } from "../db";
import {
  CodeNotFoundForReadKeyError,
  CodeNotFoundForWriteKeyError,
} from "./hook.errors";
import {
  HookCode,
  HookOverview,
  HookWorkflowState,
  VersionWorkflowState,
} from "./hook.types";

type CodeToRun = {
  workflowState: HookWorkflowState;
  versionId: string;
  compiledCode: string;
  code: string;
  hookId: string;
};

export async function incrementRequestCount({ hookId }: { hookId: string }) {
  const pool = getPool();
  await pool.any(sql`
    update "hook"
    set "requestCount" = "requestCount" + 1
    where "id" = ${hookId}
  `);
}

export async function resetRequestCount({ hookId }: { hookId: string }) {
  const pool = getPool();
  await pool.any(sql`
    update "hook"
    set "requestCount" = 0
    where "id" = ${hookId}
  `);
}

export async function getRequestCount({ hookId }: { hookId: string }) {
  const pool = getPool();
  const { requestCount } = await pool.one<{ requestCount: number }>(sql`
    select "requestCount" from "hook"
    where id = ${hookId}
  `);
  return requestCount;
}

export async function __dangerouslyDeleteHook({ hookId }: { hookId: string }) {
  const pool = getPool();
  await pool.query(sql`
    delete from "access" where "hookId" = ${hookId}
  `);
  await pool.query(sql`
    delete from "key" where "hookId" = ${hookId}
  `);
  await pool.query(sql`
    delete from "version" where "hookId" = ${hookId}
  `);
  await pool.query(sql`
    delete from "hook" where id = ${hookId}
  `);
}

export async function __dangerouslyDeleteAllRequestsForHook({
  hookId,
}: {
  hookId: string;
}) {
  const pool = getPool();
  await pool.query(sql`
    update "request"
    set "ignore" = true
    where "writeKey" in (
      select "key"
      from "key"
      where "hookId" = ${hookId}
      and "type" = 'write'
    )
  `);
}

export async function __dangerouslyHARDDeleteAllRequestsForHook({
  hookId,
}: {
  hookId: string;
}) {
  const pool = getPool();
  await pool.query(sql`
    delete from "state"
    where "hookId" = ${hookId}
  `);
  await pool.query(sql`
    delete from "request"
    where "writeKey" in (
      select "key"
      from "key"
      where "hookId" = ${hookId}
      and "type" = 'write'
    )
  `);
}

export async function listHooks({ userId }: { userId: string }) {
  const pool = getPool();
  const res = await pool.query<HookOverview>(sql`
    select
      hook.id as id,
      hook.name as "name",
      hook."workflowState" as "workflowState",
      hook."description",
      hook."requestCount"
    from "hook"
    join "access"
      on "hook"."id" = "access"."hookId"
    where "access"."userId" = ${userId}
  `);

  return res.rows;
}

export async function getOverviewForHook({
  hookId,
}: {
  hookId: string;
}): Promise<HookOverview> {
  const pool = getPool();
  const row = await pool.one<HookOverview>(sql`
    select id, name, "workflowState", "description", "requestCount"
    from "hook"
    where id = ${hookId}
  `);
  return row;
}

export async function getHookNameCollisions({ names }: { names: string[] }) {
  const pool = getPool();
  const res = await pool.query<{ name: string }>(sql`
    select hook.name as "name" from "hook"
    where "name" = ANY(${sql.array(names, "text")})
  `);

  return res.rows.map((r) => r.name);
}

export async function updateDraft(
  id: string,
  input: { code: string; compiledCode: string }
): Promise<void> {
  const pool = getPool();
  await pool.any(sql`
    update version
    set code = ${input.code}, "compiledCode" = ${input.compiledCode}
    where "workflowState" = 'draft'
      and "hookId" = ${id}
  `);
}

export async function updateDetails(
  id: string,
  input: { name: string | null; description: string | null }
) {
  const pool = getPool();
  await pool.any(sql`
    update "hook"
    set name = COALESCE(${input.name}, "name"),
    description = COALESCE(${input.description}, "description")
    where "id" = ${id}
  `);
}

export async function getEncryptedSecretAccessKey({
  hookId,
}: {
  hookId: string;
}) {
  const pool = getPool();
  const { secretAccessKey } = await pool.one<{ secretAccessKey: string }>(
    sql`
      select "secretAccessKey"
      from "hook"
      where "id" = ${hookId}
  `
  );
  return secretAccessKey;
}

export async function insertHook({
  name,
  encryptedSecretAccessKey,
}: {
  name: string;
  encryptedSecretAccessKey: string;
}) {
  const pool = getPool();
  const { id } = await pool.one<{ id: string }>(sql`
    insert into "hook"
    ("name", "secretAccessKey", "createdAt")
    values
    (${name}, ${encryptedSecretAccessKey}, NOW())
    returning id
  `);
  await pool.many<{ id: string }>(sql`
    insert into "version"
    ("hookId", "code", "workflowState", "createdAt", "updatedAt")
    values
    (${id}, '', ${VersionWorkflowState.DRAFT}, NOW(), NOW()),
    (${id}, '', ${VersionWorkflowState.PUBLISHED}, NOW(), NOW())
    returning *
  `);

  return id;
}

export async function bulkInsertHook(
  arr: {
    name: string;
    encryptedSecretAccessKey: string;
  }[]
): Promise<string[]> {
  const pool = getPool();
  const result = await pool.query<{ id: string }>(sql`
    insert into "hook"
    ("name", "secretAccessKey")
    select * from ${sql.unnest(
      arr.map((item) => {
        return [item.name, item.encryptedSecretAccessKey];
      }),
      ["varchar", "varchar"]
    )}
    
    returning id
  `);

  const versionsToInsert = result.rows.reduce((versionsSoFar, row) => {
    return [
      ...versionsSoFar,
      { id: row.id, workflowState: VersionWorkflowState.DRAFT },
      { id: row.id, workflowState: VersionWorkflowState.PUBLISHED },
    ];
  }, [] as { id: string; workflowState: VersionWorkflowState }[]);

  await pool.query<{ id: string }>(sql`
    insert into "version"
    ("hookId", "code", "workflowState")
    select * from ${sql.unnest(
      versionsToInsert.map((item) => {
        return [item.id, "", item.workflowState];
      }),
      ["uuid", "varchar", "varchar"]
    )}
  `);
  return result.rows.map((r) => r.id);
}

export async function getDraftAndPublishedCode(
  hookId: string
): Promise<HookCode> {
  const pool = getPool();
  const versions = await pool.many<
    CodeToRun & { versionWorkflowState: VersionWorkflowState }
  >(
    sql`
      select
        version.id as "versionId",
        version."hookId" as "hookId",
        version."workflowState" as "versionWorkflowState",
        hook."workflowState",
        version.code,
        version."compiledCode"
      from version
      join "hook"
        on "hook".id = "version"."hookId"
      where "version"."hookId" = ${hookId}
        and version."workflowState" in (${VersionWorkflowState.PUBLISHED}, ${VersionWorkflowState.DRAFT})
      limit 2
  `
  );

  return mapValues(keyBy(versions, "versionWorkflowState"), "code") as {
    [VersionWorkflowState.PUBLISHED]?: string;
    [VersionWorkflowState.DRAFT]: string;
  };
}

export async function getPublishedCodeByHook(
  hookId: string
): Promise<CodeToRun> {
  const pool = getPool();
  const code = await pool.one<CodeToRun>(
    sql`
      select
        version.id as "versionId",
        version."hookId" as "hookId",
        hook."workflowState",
        code,
        version."compiledCode"
      from version
      join hook
        on hook.id = version."hookId"
      where "version"."hookId" = ${hookId}
        and version."workflowState" = ${VersionWorkflowState.PUBLISHED}
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
        hook."workflowState",
        version."hookId" as "hookId",
        code,
        "compiledCode"
      from version
      join "key"
        on "key"."hookId" = version."hookId"
      join "hook"
        on "version"."hookId" = "hook"."id"
      where "key"."type" = 'write'
        and "key"."key" = ${writeKey}
        and version."workflowState" = ${VersionWorkflowState.PUBLISHED}
      limit 1
    `
  );

  if (!code) {
    throw new CodeNotFoundForWriteKeyError();
  }
  return code;
}

export async function getCodeByReadKey(writeKey: string): Promise<CodeToRun> {
  const pool = getPool();
  const code = await pool.maybeOne<CodeToRun>(
    sql`
      select
        version.id as "versionId",
        hook."workflowState",
        version."hookId" as "hookId",
        code,
        "compiledCode"
      from version
      join "key"
        on "key"."hookId" = version."hookId"
      join "hook"
        on "version"."hookId" = "hook"."id"
      where "key"."type" = 'read'
        and "key"."key" = ${writeKey}
        and version."workflowState" = ${VersionWorkflowState.PUBLISHED}
      limit 1
    `
  );

  if (!code) {
    throw new CodeNotFoundForReadKeyError();
  }
  return code;
}

export async function pauseHook({ hookId }: { hookId: string }) {
  await getPool().query(sql`
    update "hook"
    set "workflowState" = ${HookWorkflowState.PAUSED}
    where "id" = ${hookId}
  `);
}

export async function unpauseHook({ hookId }: { hookId: string }) {
  await getPool().query(sql`
    update "hook"
    set "workflowState" = ${HookWorkflowState.LIVE}
    where "id" = ${hookId}
  `);
}

export async function isHookPaused({
  hookId,
}: {
  hookId: string;
}): Promise<boolean> {
  const res = await getPool().one<{ workflowState: HookWorkflowState }>(sql`
    select "workflowState"
    from "hook"
    where id = ${hookId}
  `);
  return res.workflowState === HookWorkflowState.PAUSED;
}

export async function markPublishedVersionAsOld({
  hookId,
}: {
  hookId: string;
}) {
  await getPool().one(sql`
    update "version"
    set "workflowState" = ${VersionWorkflowState.OLD}
    where "hookId" = ${hookId}
    and "workflowState" = ${VersionWorkflowState.PUBLISHED}
    returning id
  `);
}

export async function markDraftAsPublished({ hookId }: { hookId: string }) {
  await getPool().one(sql`
    update "version"
    set "workflowState" = ${VersionWorkflowState.PUBLISHED}
    where "hookId" = ${hookId}
    and "workflowState" = ${VersionWorkflowState.DRAFT}
    returning id
  `);
}

export async function createDraft({ hookId }: { hookId: string }) {
  const publishedVersion = await getPublishedCodeByHook(hookId);
  await getPool().one<{ id: string }>(sql`
    insert into "version"
    ("hookId", "code", "compiledCode", "workflowState", "createdAt", "updatedAt")
    values
    (${hookId}, ${publishedVersion.code || ""}, ${
    publishedVersion.compiledCode || ""
  }, ${VersionWorkflowState.DRAFT}, NOW(), NOW())
    returning id
  `);
}
