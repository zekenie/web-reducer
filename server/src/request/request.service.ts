import { enqueue } from "../worker/queue.service";
import { getQueue, getQueueEvents } from "../worker/queues";
import * as requestDb from "./request.db";
import { WebhookRequest, WORKER_NAME } from "./request.types";
import { queueNameForWriteKey } from "./request-hash.helper";
import * as hookDb from "../hook/hook.db";
import * as stateDb from "../state/state.db";
import {
  getRunnerJobIdForRequestId,
  queueNameForHookId as runnerQueueNameForHookId,
} from "../runner/runner-hash.helper";
import { UnableToResolveSettledRequest } from "./request.errors";
import { runCode } from "../runner/vm.remote";
import { _dangerouslyExposeSecretsInPlaintextForNamespace } from "../secret/secret.remote";
import { getAccessKeyForHook } from "../secret/secret.service";

export async function captureRequest(params: requestDb.CaptureRequest) {
  const { requestId, hookId } = await requestDb.captureRequest(params);
  if (params.ignore) {
    return;
  }
  await enqueue(
    {
      name: "run-hook",
      input: {
        requestId,
        hookId,
      },
    },
    getRunnerJobIdForRequestId(requestId)
  );
}

export async function handleRequest({
  request,
  contentType,
  writeKey,
}: {
  request: WebhookRequest;
  contentType: string;
  writeKey: string;
}) {
  const codeToRun = await hookDb.getCodeByWriteKey(writeKey);
  const secrets = await _dangerouslyExposeSecretsInPlaintextForNamespace({
    accessKey: await getAccessKeyForHook({ hookId: codeToRun.hookId }),
  });
  const { response } = await runCode({
    code: codeToRun.compiledCode,
    mode: "response",
    request,
    secrets,
    state: undefined,
  });

  await enqueue(
    {
      name: "request",
      input: {
        request,
        ignore: response?.statusCode! > 399,
        contentType,
        writeKey,
      },
    },
    getRequestJobIdForRequestId(request.id)
  );

  return response;
}

export function getRequestJobIdForRequestId(requestId: string): string {
  return `${WORKER_NAME}-${requestId}`;
}

/**
 * This function returns a promise that resolves when a request
 * has been fully processed
 */
export async function resolveWhenJobSettled(
  requestId: string,
  writeKey: string,
  attempt: number = 0
): Promise<"settled"> {
  if (attempt >= 3) {
    throw new UnableToResolveSettledRequest(
      "state does not exist after runner job has completed"
    );
  }
  const requestQueue = getQueue(queueNameForWriteKey(writeKey));
  const requestQueueEvents = getQueueEvents(queueNameForWriteKey(writeKey));
  const request = await requestDb.getRequestToRun(requestId);
  if (!request) {
    const captureRequestJob = await requestQueue.getJob(
      getRequestJobIdForRequestId(requestId)
    );
    if (!captureRequestJob) {
      throw new UnableToResolveSettledRequest(
        "no request found on req queue or db"
      );
    }
    await captureRequestJob.waitUntilFinished(requestQueueEvents);
  }

  const { versionId, hookId } = await hookDb.getCodeByWriteKey(writeKey);
  const stateExists = await stateDb.doesStateExist({
    requestId,
    versionId,
    hookId,
  });
  if (stateExists) {
    return "settled";
  }
  const queueName = runnerQueueNameForHookId(hookId);
  const job = await getQueue(queueName).getJob(
    getRunnerJobIdForRequestId(requestId)
  );
  if (!job) {
    throw new UnableToResolveSettledRequest(
      "neither in db or enqueued... possible dropped request"
    );
  }
  await job.waitUntilFinished(getQueueEvents(queueName));
  return resolveWhenJobSettled(requestId, writeKey, attempt + 1);
}
