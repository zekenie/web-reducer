import { getCodeByWriteKey } from "../hook/hook.db";
import { getRequestToRun } from "../request/request.db";
import { createState, fetchState } from "../state/state.db";
import { runCode } from "./vm.remote";

export async function runHook(requestId: string): Promise<unknown> {
  const request = await getRequestToRun(requestId);
  console.log({ request });
  const { versionId, hookId, code } = await getCodeByWriteKey(request.writeKey);

  const state = await fetchState({ hookId, versionId });

  const {
    state: newState,
    ms,
    error,
  } = await runCode({
    code,
    request: {
      body: request.body,
      headers: request.headers,
    },
    state: state?.state,
  });

  await createState({
    state: newState as {},
    error,
    hookId,
    requestId,
    versionId,
    executionTime: ms,
  });

  return false;
}
