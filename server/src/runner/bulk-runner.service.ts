import { cargoQueue } from "async";
import { keyBy, last } from "lodash";
import { sql } from "slonik";
import { bulkInsertConsole } from "../console/console.db";
import { ConsoleMessage, ConsoleMessageInsert } from "../console/console.types";
import { getPool, transaction } from "../db";
import {
  getPublishedCodeByHook,
  isHookPaused,
  unpauseHook,
} from "../hook/hook.db";
import { getKeysForHook } from "../key/key.service";
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
import { readState } from "../state/state.service";
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
            code: code.compiledCode,
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
          const stateResults = await bulkCreateState({
            hookId,
            versionId: code.versionId,
            requests: runResults.map((result, i) => {
              const request = requests[i];
              return {
                id: request.id,
                idempotencyKey: result.idempotencyKey,
                executionTime: result.ms,
                state: result.state as {},
                error: result.error,
              };
            }),
          });

          const stateResultsByRequestId = keyBy(stateResults, "requestId");

          await bulkInsertConsole({
            consoleLogs: runResults.reduce((acc, runResult, i) => {
              const request = requests[i];
              return [
                ...acc,
                ...runResult.console.map((con) => ({
                  ...con,
                  requestId: request.id!,
                  stateId: stateResultsByRequestId[request.id].id,
                })),
              ];
            }, [] as ConsoleMessageInsert[]),
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
    if (cq.started) {
      // if we wait for this when there are 1 requests, it will never resolve
      await cq.drain();
    }
  });

  const remainingUnprocessedRequests = await countPendingRequests({ hookId });
  if (remainingUnprocessedRequests > 0) {
    return runBulk(hookId, onProgress, attempts + 1);
  } else {
    await unpauseHook({ hookId });

    const { readKeys } = await getKeysForHook({ hookId });
    if (!readKeys.length) {
      return;
    }
    const { state } = await readState(readKeys[0]);
    await publishBulkUpdate({ hookId, state, readKeys });
  }
}
