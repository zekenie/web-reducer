import { cargoQueue } from "async";
import { last } from "lodash";
import { transaction } from "../db";
import {
  getPublishedCodeByHook,
  isHookPaused,
  unpauseHook,
} from "../hook/hook.db";
import {
  countPendingRequests,
  countRequestsForHook,
  streamRequestsForHook,
} from "../request/request.db";
import { WebhookRequest } from "../request/request.types";
import { _dangerouslyExposeSecretsInPlaintextForNamespace } from "../secret/secret.remote";
import { getAccessKeyForHook } from "../secret/secret.service";
import {
  bulkCreateState,
  checkValidityOfIdempotencyKeys,
  fetchState,
} from "../state/state.db";
import { publishBulkUpdate } from "./runner.publisher";
import { runCodeBulk } from "./vm.remote";

export async function runBulk(
  hookId: string,
  onProgress: (progress: number) => void,
  attempts: number = 0
): Promise<void> {
  if (attempts > 5) {
    throw new Error("too much volume on hook to catch up");
  }
  if (!(await isHookPaused({ hookId }))) {
    throw new Error("cannot batch process state on live hook");
  }
  const secrets = await _dangerouslyExposeSecretsInPlaintextForNamespace({
    accessKey: await getAccessKeyForHook({ hookId }),
  });
  await transaction(async () => {
    const code = await getPublishedCodeByHook(hookId);
    const lastStateRecord = await fetchState({
      hookId,
      versionId: code.versionId,
    });
    const totalRequests = await countRequestsForHook(
      hookId,
      lastStateRecord?.createdAt
    );

    let currentState = lastStateRecord?.state;
    let processed = 0;
    const cq = cargoQueue<WebhookRequest>(
      async function (requests, done) {
        async function _runChunk(
          invalidIdempotencyKeys: string[] = []
        ): Promise<void> {
          const runResults = await runCodeBulk({
            secrets,
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

  const remainingUnprocessedRequests = await countPendingRequests({ hookId });
  if (remainingUnprocessedRequests > 0) {
    return runBulk(hookId, onProgress, attempts + 1);
  } else {
    await unpauseHook({ hookId });

    setImmediate(() => publishBulkUpdate({ hookId }));
  }
}
