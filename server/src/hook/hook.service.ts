import { getPool } from "../db";
import UpdateHook from "./inputs/update-hook.input";
import * as db from "./hook.db";
import { createKey } from "../key/key.db";
import { provisionAccess } from "../access/access.db";

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

export async function publishDraft() {
  // transaction?
  // pause current processing of hook somehow?
  // take current and make old
  // take draft and make published
  // make new draft
  // enqueue job to resync state (or not depending on pref?!)
  // recursively batch process state until there is none, then resume
}
