import IORedis from "ioredis";
import { StateHistory } from "../state/state.types";

// separate connection from bull so that we're not in pub mode
// and don't conflict with their settings
export const connection = new IORedis(process.env.REDIS_URL);

export async function publishState({
  request,
  readKeys,
  hookId,
}: {
  request: StateHistory;
  readKeys: string[];
  hookId: string;
}) {
  const message = {
    type: "new-request",
    request,
    hookId,
    readKeys,
  };
  const pipeline = connection
    .pipeline()
    .publish(`state.${hookId}`, JSON.stringify(message));

  const pipelineWithReadKeys = readKeys.reduce((p, readKey) => {
    const m = { type: "new-state", state: request.state };
    return p.publish(`read-key.${readKey}`, JSON.stringify(m));
  }, pipeline);

  await pipelineWithReadKeys.exec();
}

export async function publishBulkUpdate({
  hookId,
}: {
  hookId: string;
}): Promise<void> {
  await connection.publish(
    `bulk-update.${hookId}`,
    JSON.stringify({ type: "bulk-update", hookId })
  );
}
