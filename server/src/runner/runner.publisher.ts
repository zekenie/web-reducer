import { connection, connection as redisConnection } from "../redis";
import { StateHistory } from "../state/state.types";

export async function publishState({
  state,
  readKey,
}: {
  state: StateHistory;
  readKey: string;
}) {
  const message = {
    state,
    readKey,
  };

  await connection.publish(`state.${readKey}`, JSON.stringify(message));
}
