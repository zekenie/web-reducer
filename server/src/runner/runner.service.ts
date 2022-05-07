import { getCodeByWriteKey, getKeysForHook } from "../hook/hook.db";
import { HookWorkflowState } from "../hook/hook.types";
import { getRequestToRun } from "../request/request.db";
import { createState, fetchState, isIdempotencyKeyOk } from "../state/state.db";
import { StateHistory } from "../state/state.types";
import { publishState } from "./runner.publisher";
import { runCode } from "./vm.remote";

export async function runHook(requestId: string): Promise<void> {
  const request = await getRequestToRun(requestId);
  if (!request) {
    throw new Error(`request ${requestId} not found`);
  }
  const { versionId, hookId, code, workflowState } = await getCodeByWriteKey(
    request.writeKey
  );

  if (workflowState === HookWorkflowState.PAUSED) {
    return;
  }

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
      createdAt: request.createdAt,
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

  try {
    await getReadKeysAndPublishState({
      hookId,
      state: {
        body: request.body,
        console,
        createdAt: new Date(request.createdAt),
        error,
        requestId: request.id,
        state,
      },
    });
  } catch (e) {
    // don't fail the job just because we couldn't notify about the state
  }
}

async function getReadKeysAndPublishState({
  hookId,
  state,
}: {
  hookId: string;
  state: StateHistory;
}) {
  const keys = await getKeysForHook({ hookId });

  await publishState({ hookId, readKeys: keys.readKeys, state });
}
