import { readState as readStateDb } from "./state.db";
export async function readState(readKey: string) {
  return readStateDb(readKey);
}
