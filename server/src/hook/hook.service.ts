import { provisionAccess } from "../access/access.db";
import { encrypt } from "../crypto/crypto.service";
import { transaction } from "../db";
import * as secretService from "../secret/secret.remote";
import { enqueue } from "../worker/queue.service";
import { generateUnusedHookName } from "./hook-name.service";
import * as db from "./hook.db";
import { HookDetail } from "./hook.types";
import UpdateHookInput from "./inputs/update-hook.input";
import * as ts from "typescript";
import * as keyService from "../key/key.service";
import { createKey } from "../key/key.service";

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
      const hookId = await db.createHook({ name, encryptedSecretAccessKey });
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

export async function updateDraft(hookId: string, input: UpdateHookInput) {
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
