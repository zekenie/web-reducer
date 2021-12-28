import { getCodeByWriteKey } from "../hook/hook.db";
import { getRequestToRun } from "../request/request.db";
import { createState, fetchState, isIdempotencyKeyOk } from "../state/state.db";
import { WORKER_NAME } from "./types";
import { runCode } from "./vm.remote";

export const NUM_BUCKETS = 10;

export function hashHookIdToNumber(str: string): number {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num += str.charCodeAt(i);
  }
  return num % NUM_BUCKETS;
}

export function queueNameForBucket(bucket: number) {
  return `${WORKER_NAME}-${bucket}`;
}

export function queueNameForHookId(hookId: string): string {
  const bucket = hashHookIdToNumber(hookId);
  return queueNameForBucket(bucket);
}

export function getRunnerJobIdForRequestId(reqId: string): string {
  return `${WORKER_NAME}-${reqId}`;
}

export async function runHook(requestId: string): Promise<unknown> {
  const request = await getRequestToRun(requestId);
  if (!request) {
    throw new Error(`request ${requestId} not found`);
  }
  const { versionId, hookId, code } = await getCodeByWriteKey(request.writeKey);

  const state = await fetchState({ hookId, versionId });

  const {
    state: newState,
    ms,
    idempotencyKey,
    console,
    error,
  } = await runCode({
    code,
    request: {
      id: requestId,
      body: request.body,
      headers: request.headers,
    },
    state: state?.state,
  });

  if (idempotencyKey) {
    const ok = await isIdempotencyKeyOk(idempotencyKey, { versionId, hookId });
    if (!ok) {
      return createState({
        // leave old state as is because we have an idempotency violation
        state: state as {},
        error,
        hookId,
        requestId,
        console,
        idempotencyKey,
        versionId,
        executionTime: ms,
      });
    }
  }

  await createState({
    state: newState as {},
    error,
    hookId,
    requestId,
    console,
    idempotencyKey,
    versionId,
    executionTime: ms,
  });

  return false;
}
