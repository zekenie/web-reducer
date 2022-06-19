import {
  PaginatedTokenResponse,
  PaginationQueryArgs,
} from "../pagination/pagination.types";
import * as stateDb from "./state.db";
import { StateHistory, StateHistoryContract } from "./state.types";
// @ts-ignore
import { Nilsimsa } from "nilsimsa";
import { isReadKeyValid } from "../key/key.db";
import { runCode } from "../runner/vm.remote";
import * as hookDb from "../hook/hook.db";
import { _dangerouslyExposeSecretsInPlaintextForNamespace } from "../secret/secret.remote";
import { getAccessKeyForHook } from "../secret/secret.service";

export async function readState(readKey: string, queryString?: string) {
  const [keyValid, stateRecord] = await Promise.all([
    isReadKeyValid(readKey),
    stateDb.readCurrentState(readKey),
  ]);

  const codeToRun = await hookDb.getCodeByReadKey(readKey);
  const secrets = await _dangerouslyExposeSecretsInPlaintextForNamespace({
    accessKey: await getAccessKeyForHook({ hookId: codeToRun.hookId }),
  });

  const { response } = await runCode({
    code: codeToRun.compiledCode,
    mode: "query",
    request: {
      id: "",
      body: {},
      createdAt: new Date().toString(),
      queryString: queryString || "",
      headers: {},
    },
    secrets,
    state: stateRecord?.state,
  });

  return { keyValid, state: response?.body };
}

export async function readStateHistoryPage(
  hookId: string,
  paginationArgs: PaginationQueryArgs
): Promise<PaginatedTokenResponse<StateHistoryContract>> {
  const page = await stateDb.getStateHistoryPage(hookId, paginationArgs);

  return {
    ...page,
    objects: page.objects.map(fulfillStateHistoryContract),
  };
}

function fulfillStateHistoryContract(
  history: StateHistory
): StateHistoryContract {
  return {
    ...history,
    bodyHash: new Nilsimsa(JSON.stringify(history.body)).digest("hex"),
    stateHash: new Nilsimsa(JSON.stringify(history.state)).digest("hex"),
  };
}

export async function readStateHistory({
  requestId,
}: {
  requestId: string;
}): Promise<StateHistoryContract | null> {
  const historyRecord = await stateDb.getStateHistoryForRequest({ requestId });

  if (!historyRecord) {
    return null;
  }

  return fulfillStateHistoryContract(historyRecord);
}

// @todo get single state history record
