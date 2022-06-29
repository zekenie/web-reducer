import { bulkGenerateTokens, generateToken } from "../token/token.service";
import * as db from "./key.db";
import { KeyRecord, KeysByType, KeyType } from "./key.types";
export async function createKey({
  type,
  hookId,
}: {
  type: KeyType;
  hookId: string;
}): Promise<string> {
  const key = await generateToken();
  await db.insertKey({ hookId, type, key });
  return key;
}

export async function bulkCreateKeys(
  arr: {
    type: KeyType;
    hookId: string;
  }[]
): Promise<{ key: string; type: KeyType }[]> {
  const keys = await bulkGenerateTokens(arr.length);
  // await db.createKey({ hookId, type, key });
  // return key;
  await db.bulkInsertKeys(arr.map((item, i) => ({ ...item, key: keys[i] })));
  return arr.map((item, i) => ({ type: item.type, key: keys[i] }));
}

export async function pauseKey({
  key,
  hookId,
}: {
  key: string;
  hookId: string;
}): Promise<{ paused: boolean }> {
  return db.pauseKey({ hookId, key });
}

export async function playKey({
  key,
  hookId,
}: {
  key: string;
  hookId: string;
}): Promise<{ played: boolean }> {
  return db.playKey({ hookId, key });
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

export async function getKeyRecordsForHook({
  hookId,
}: {
  hookId: string;
}): Promise<readonly KeyRecord[]> {
  return db.getKeysForHook({ hookId });
}
