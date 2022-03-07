import { cargoQueue } from "async";
import { last } from "lodash";
import { getPool } from "../db";
import { getPublishedCodeByHook } from "../hook/hook.db";
import {
  countRequestsForHook,
  streamRequestsForHook,
} from "../request/request.db";
import { WebhookRequest } from "../request/request.types";
import {
  bulkCreateState,
  checkValidityOfIdempotencyKeys,
  fetchState,
} from "../state/state.db";
import { runCodeBulk } from "./vm.remote";

export async function runBulk(
  hookId: string,
  onProgress: (progress: number) => void
): Promise<void> {
  const pool = getPool();
  await pool.transaction(async () => {
    const code = await getPublishedCodeByHook(hookId);
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
    const cq = cargoQueue<WebhookRequest>(
      async function (requests, done) {
        async function _runChunk(
          invalidIdempotencyKeys: string[] = []
        ): Promise<void> {
          const runResults = await runCodeBulk({
            code: code.code,
            requests: requests,
            idempotencyKeysToIgnore: invalidIdempotencyKeys,
            state: currentState,
          });

          // this recursion only goes 1 layer deep.
          // we don't have to check for duplicates again
          // if we already have ignoreIds (meaning we already)
          // ran this code
          if (invalidIdempotencyKeys.length > 0) {
            const existingKeys: string[] = runResults
              .map((result) => result.idempotencyKey as string)
              .filter((key) => !!key);
            const resultsHaveIdempotencyKeys = existingKeys.length > 0;

            if (resultsHaveIdempotencyKeys) {
              const invalidKeys = await checkValidityOfIdempotencyKeys(
                existingKeys,
                {
                  hookId,
                  versionId: code.versionId,
                }
              );
              if (invalidKeys.length) {
                await _runChunk(invalidKeys);
                return done();
              }
            }
          }

          const lastResult = last(runResults)!;
          currentState = lastResult.state as {};
          await bulkCreateState({
            hookId,
            versionId: code.versionId,
            requests: runResults.map((result, i) => {
              const request = requests[i];
              return {
                id: request.id,
                console: result.console,
                idempotencyKey: result.idempotencyKey,
                executionTime: result.ms,
                state: result.state as {},
                error: result.error,
              };
            }),
          });
        }

        await _runChunk();

        processed += requests.length;
        onProgress(processed / totalRequests);
        done();
      },
      1,
      100
    );
    await streamRequestsForHook(hookId, cq.push);
  });
}
