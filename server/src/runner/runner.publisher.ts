import IORedis from "ioredis";
import { StateHistory } from "../state/state.types";

// separate connection from bull so that we're not in pub mode
// and don't conflict with their settings
export const connection = new IORedis(process.env.REDIS_URL);

export async function publishState({
  state,
  readKeys,
  hookId,
}: {
  state: StateHistory;
  readKeys: string[];
  hookId: string;
}) {
  const message = {
    state,
    hookId,
    readKeys,
  };
  await connection.publish(`state.${hookId}`, JSON.stringify(message));
}
