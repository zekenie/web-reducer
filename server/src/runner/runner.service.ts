import { getCodeByWriteKey } from "../hook/hook.db";
import { HookWorkflowState } from "../hook/hook.types";
import { getKeysForHook } from "../key/key.service";
import { getRequestToRun } from "../request/request.db";
import { _dangerouslyExposeSecretsInPlaintextForNamespace } from "../secret/secret.remote";
import { getAccessKeyForHook } from "../secret/secret.service";
import { createState, fetchState, isIdempotencyKeyOk } from "../state/state.db";
import { readStateHistory } from "../state/state.service";
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

  const [state, secrets] = await Promise.all([
    fetchState({ hookId, versionId }),
    _dangerouslyExposeSecretsInPlaintextForNamespace({
      accessKey: await getAccessKeyForHook({ hookId }),
    }),
  ]);

  const {
    state: newState,
    ms,
    idempotencyKey,
    console,
    error,
  } = await runCode({
    code,
    secrets,
    request: {
      id: requestId,
      body: request.body,
      queryString: request.queryString,
      headers: request.headers,
      createdAt: request.createdAt,
    },
    mode: "reducer",
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
    const stateHistory = await readStateHistory({ requestId });
    if (!stateHistory) {
      return;
    }
    await getReadKeysAndPublishState({
      hookId,
      state: stateHistory,
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

  await publishState({ hookId, readKeys: keys.readKeys, request: state });
}
