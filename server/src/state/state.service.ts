import {
  PaginatedTokenResponse,
  PaginationQueryArgs,
} from "../pagination/pagination.types";
import * as stateDb from "./state.db";
import { StateHistory, StateHistoryContract } from "./state.types";
// @ts-ignore
import { Nilsimsa } from "nilsimsa";
import { isReadKeyValid } from "../key/key.db";

export async function readState(readKey: string) {
  const [keyValid, stateRecord] = await Promise.all([
    isReadKeyValid(readKey),
    stateDb.readCurrentState(readKey),
  ]);
  return { keyValid, state: stateRecord?.state };
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
