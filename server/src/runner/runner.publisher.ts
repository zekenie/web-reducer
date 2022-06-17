import IORedis from "ioredis";
import { StateHistory } from "../state/state.types";

// separate connection from bull so that we're not in pub mode
// and don't conflict with their settings
export const connection = new IORedis(process.env.REDIS_URL, {
  family: process.env.NODE_ENV! === "production" ? 6 : undefined,
});

export async function publishState({
  request,
  readKeys,
  requestCount,
  hookId,
}: {
  request: StateHistory;
  readKeys: string[];
  hookId: string;
  requestCount: number;
}) {
  const message = {
    type: "new-request",
    request,
    hookId,
    requestCount,
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
  state,
  readKeys,
}: {
  readKeys: string[];
  hookId: string;
  state: unknown;
}): Promise<void> {
  const pipeline = connection
    .pipeline()
    .publish(
      `bulk-update.${hookId}`,
      JSON.stringify({ type: "bulk-update", hookId, state })
    );

  const pipelineWithReadKeys = readKeys.reduce((p, readKey) => {
    const m = { type: "bulk-update", state };
    return p.publish(`read-key.bulk-update.${readKey}`, JSON.stringify(m));
  }, pipeline);

  await pipelineWithReadKeys.exec();
}
