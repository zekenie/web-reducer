import { generateToken } from "../token/token.service";
import * as db from "./key.db";
import { KeysByType } from "./key.types";
export async function createKey({
  type,
  hookId,
}: {
  type: "read" | "write";
  hookId: string;
}): Promise<string> {
  const key = await generateToken();
  await db.createKey({ hookId, type, key });
  return key;
}

export async function deleteKey({
  key,
  hookId,
}: {
  key: string;
  hookId: string;
}): Promise<{ deleted: boolean }> {
  return db.deleteKey({ hookId, key });
}

export async function getKeysForHook({
  hookId,
}: {
  hookId: string;
}): Promise<KeysByType> {
  const keys = await db.getKeysForHook({ hookId });
  return {
    readKeys: keys.filter((row) => row.type === "read").map((r) => r.key),
    writeKeys: keys.filter((row) => row.type === "write").map((r) => r.key),
  };
}
