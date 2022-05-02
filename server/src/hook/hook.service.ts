import { getPool, transaction } from "../db";
import UpdateHook from "./inputs/update-hook.input";
import * as db from "./hook.db";
import { createKey } from "../key/key.db";
import { provisionAccess } from "../access/access.db";
import { enqueue } from "../worker/queue.service";
import { generateUnusedHookName } from "./hook-name.service";
import { HookDetail, HookOverview } from "./hook.types";

export async function listHooks({ userId }: { userId: string }) {
  return db.listHooks({ userId });
}

export async function readHook(id: string): Promise<HookDetail> {
  const code = await db.getDraftAndPublishedCode(id);
  const keysForHook = await db.getKeysForHook({ hookId: id });
  const overview = await db.getOverviewForHook({ hookId: id });
  return {
    ...code,
    ...keysForHook,
    ...overview,
  };
}

export async function createHook({
  userId,
}: {
  userId: string;
}): Promise<HookDetail> {
  return transaction(async () => {
    const name = await generateUnusedHookName();
    const hookId = await db.createHook({ name });
    await Promise.all([
      provisionAccess({ hookId, userId }),
      createKey({ type: "write", hookId }),
      createKey({ type: "read", hookId }),
    ]);
    // return { hookId, writeKey, readKey };
    return readHook(hookId);
  });
}

export async function updateDraft(hookId: string, input: UpdateHook) {
  await db.updateDraft(hookId, input);
}

export async function publishDraft({ hookId }: { hookId: string }) {
  await transaction(async () => {
    await db.pauseHook({ hookId });
    await db.markPublishedVersionAsOld({ hookId });
    await db.markDraftAsPublished({ hookId });
    await db.createDraft({ hookId });
    await enqueue({
      name: "bulk-run-hook",
      input: {
        hookId,
      },
    });
  });
}
