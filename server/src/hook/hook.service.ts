import { bulkProvisionAccess, provisionAccess } from "../access/access.db";
import { encrypt } from "../crypto/crypto.service";
import { transaction } from "../db";
import * as secretService from "../secret/secret.remote";
import { enqueue } from "../worker/queue.service";
import {
  bulkGenerateHookNames,
  generateUnusedHookName,
} from "./hook-name.service";
import * as db from "./hook.db";
import { HookDetail } from "./hook.types";
import * as ts from "typescript";
import * as keyService from "../key/key.service";
import { createKey } from "../key/key.service";
import { KeyType } from "../key/key.types";

export async function listHooks({ userId }: { userId: string }) {
  return db.listHooks({ userId });
}

export async function readHook(id: string): Promise<HookDetail> {
  const code = await db.getDraftAndPublishedCode(id);
  const keysForHook = await keyService.getKeysForHook({ hookId: id });
  const overview = await db.getOverviewForHook({ hookId: id });
  return {
    ...code,
    ...keysForHook,
    ...overview,
  };
}

export async function bulkCreateHook({
  userIds,
  secretNamespaceAccessKeys,
}: {
  userIds: string[];
  secretNamespaceAccessKeys: string[];
}): Promise<string[]> {
  const names = bulkGenerateHookNames({ n: userIds.length });
  const encryptedAccessKeys = secretNamespaceAccessKeys.map((accessKey) =>
    encrypt(accessKey, process.env.SECRET_ACCESS_KEY_KEY!)
  );

  console.log("names and keys");

  const hookIds = await db.bulkInsertHook(
    Array.from({ length: userIds.length }, (n, i) => ({
      name: names[i],
      encryptedSecretAccessKey: encryptedAccessKeys[i],
    }))
  );

  console.log("bulk insert hook works");

  await Promise.all([
    bulkProvisionAccess(
      Array.from({ length: userIds.length }, (n, i) => ({
        hookId: hookIds[i],
        userId: userIds[i],
      }))
    ),
    keyService.bulkCreateKeys(
      hookIds.reduce((arr, hookId) => {
        return [...arr, { type: "read", hookId }, { type: "write", hookId }];
      }, [] as { type: KeyType; hookId: string }[])
    ),
  ]);

  return hookIds;
}

export async function createHook({
  userId,
}: {
  userId: string;
}): Promise<HookDetail> {
  const { accessKey: secretNamespaceAccessKey } =
    await secretService.createNamespace();
  const encryptedSecretAccessKey = encrypt(
    secretNamespaceAccessKey,
    process.env.SECRET_ACCESS_KEY_KEY!
  );
  try {
    return transaction(async () => {
      const name = await generateUnusedHookName();
      const hookId = await db.insertHook({ name, encryptedSecretAccessKey });
      await Promise.all([
        provisionAccess({ hookId, userId }),
        createKey({ type: "write", hookId }),
        createKey({ type: "read", hookId }),
      ]);
      return readHook(hookId);
    });
  } catch (e) {
    await secretService.deleteNamespace({
      accessKey: secretNamespaceAccessKey,
    });
    throw e;
  }
}

export async function __dangerouslyDeleteAllRequestsForHook({
  hookId,
}: {
  hookId: string;
}) {
  await db.__dangerouslyDeleteAllRequestsForHook({ hookId });
  await db.pauseHook({ hookId });
  await enqueue({
    name: "bulk-run-hook",
    input: {
      hookId,
    },
  });
}

export async function updateDetails(
  id: string,
  input: { name: string | null; description: string | null }
) {
  if (Object.keys(input).length === 0) {
    return;
  }
  await db.updateDetails(id, {
    name: input.name,
    description: input.description,
  });
}

export async function updateDraft(hookId: string, input: { code: string }) {
  const compiledCode =
    input.code.trim() === ""
      ? ""
      : ts.transpileModule(input.code, {
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText;
  await db.updateDraft(hookId, { ...input, compiledCode });
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
