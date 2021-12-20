import { getPool } from "../db";
import UpdateHook from "./inputs/update-hook.input";
import { createHook as createHookDb } from "./hook.db";
import { createKey } from "../key/key.db";

export async function createHook() {
  const pool = getPool();
  await pool.transaction(async () => {
    const hookId = await createHookDb();
    const writeKey = await createKey({ type: "write", hookId });
    const readKey = await createKey({ type: "read", hookId });
    return { hookId, writeKey, readKey };
  });
}

export async function updateDraft(input: UpdateHook) {}

export async function publishDraft() {
  // transaction?
  // pause current processing of hook somehow?
  // take current and make old
  // take draft and make published
  // make new draft
  // enqueue job to resync state (or not!)
}
