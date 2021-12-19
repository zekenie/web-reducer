import { cargoQueue } from "async";
import { last } from "lodash";
import { getPool } from "../db";
import { getCodeByHook } from "../hook/hook.db";
import {
  countRequestsForHook,
  streamRequestsForHook,
} from "../request/request.db";
import { WebhookRequest } from "../request/types";
import { bulkCreateState, fetchState } from "../state/state.db";
import { runCodeBulk } from "./vm.remote";

export async function runBulk(
  hookId: string,
  onProgress: (progress: number) => void
): Promise<void> {
  const pool = getPool();
  await pool.transaction(async () => {
    const code = await getCodeByHook(hookId);
    const lastStateRecord = await fetchState({
      hookId,
      versionId: code.versionId,
    });
    const totalRequests = await countRequestsForHook(
      hookId,
      lastStateRecord?.requestId
    );

    let currentState = lastStateRecord?.state || {};
    let processed = 0;
    const cq = cargoQueue<WebhookRequest & { id: string }>(
      async function (requests) {
        const runResults = await runCodeBulk({
          code: code.code,
          requests,
          state: currentState,
        });
        const lastResult = last(runResults)!;
        currentState = lastResult.state as {};
        await bulkCreateState({
          hookId,
          versionId: code.versionId,
          requests: runResults.map((result, i) => {
            const request = requests[i];
            return {
              id: request.id,
              executionTime: result.ms,
              state: result.state as {},
              error: result.error,
            };
          }),
        });
        processed += requests.length;
        onProgress(processed / totalRequests);
      },
      1,
      100
    );
    await streamRequestsForHook(hookId, cq.push);
  });
}
