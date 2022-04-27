import { getPool, transaction } from "../db";
import UpdateHook from "./inputs/update-hook.input";
import * as db from "./hook.db";
import { createKey } from "../key/key.db";
import { provisionAccess } from "../access/access.db";
import { enqueue } from "../worker/queue.service";

export async function listHooks({ userId }: { userId: string }) {
  return db.listHooks({ userId });
}

export async function readHook(id: string) {
  return db.getDraftAndPublishedCode(id);
}

export async function createHook({ userId }: { userId: string }) {
  const pool = getPool();
  return pool.transaction(async () => {
    const hookId = await db.createHook();
    await provisionAccess({ hookId, userId });
    const writeKey = await createKey({ type: "write", hookId });
    const readKey = await createKey({ type: "read", hookId });
    return { hookId, writeKey, readKey };
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
