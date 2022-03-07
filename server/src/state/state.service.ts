import { PaginationQueryArgs } from "../pagination/pagination.types";
import * as stateDb from "./state.db";

export async function readState(readKey: string) {
  return stateDb.readState(readKey);
}

export async function readStateHistory(
  hookId: string,
  paginationArgs: PaginationQueryArgs
) {
  return stateDb.getStateHistory(hookId, paginationArgs);
}
