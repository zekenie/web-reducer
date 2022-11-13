import { bulkInsertConsole } from "../console/console.db";
import { getCodeByWriteKey, getRequestCount } from "../hook/hook.db";
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

const realConsole = console;

export async function runHook(requestId: string): Promise<void> {
  const request = await getRequestToRun(requestId);
  if (!request) {
    throw new Error(`request ${requestId} not found`);
  }
  const {
    versionId,
    hookId,
    compiledCode: code,
    workflowState,
  } = await getCodeByWriteKey(request.writeKey);

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

  const shouldKeepOldState =
    idempotencyKey &&
    !(await isIdempotencyKeyOk(idempotencyKey, { versionId, hookId }));

  const { id: stateId } = await createState({
    state: shouldKeepOldState ? (state as {}) : (newState as {}),
    error,
    hookId,
    requestId,
    idempotencyKey,
    versionId,
    executionTime: ms,
  });

  await bulkInsertConsole({
    consoleLogs: console.map((c) => ({
      level: c.level,
      messages: c.messages,
      timestamp: new Date(c.timestamp),
      stateId,
      requestId,
    })),
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
    realConsole.warn("error publishing on socket", e);
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
  const [keys, requestCount] = await Promise.all([
    getKeysForHook({ hookId }),
    getRequestCount({ hookId }),
  ]);

  await publishState({
    hookId,
    requestCount,
    readKeys: keys.readKeys,
    request: state,
  });
}
