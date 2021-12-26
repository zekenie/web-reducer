import { enqueue } from "../worker/queue.service";
import { getQueue, getQueueEvents } from "../worker/queues";
import {
  WORKER_NAME as REQUEST_WORKER_NAME,
  WORKER_NAME,
} from "./request.worker";
import { WebhookRequest } from "./types";
import * as requestDb from "./request.db";
import * as stateDb from "../state/state.db";
import * as hookDb from "../hook/hook.db";
import {
  getRunnerJobIdForRequestId,
  queueNameForHookId,
} from "../runner/runner.service";

export async function handleRequest({
  request,
  contentType,
  writeKey,
}: {
  request: WebhookRequest;
  contentType: string;
  writeKey: string;
}) {
  await enqueue(
    {
      name: "request",
      input: {
        request,
        contentType,
        writeKey,
      },
    },
    getRequestJobIdForRequestId(request.id)
  );
}

export function getRequestJobIdForRequestId(requestId: string): string {
  return `${WORKER_NAME}-${requestId}`;
}

/**
 * This function returns a promise that resolves when a request
 * has been fully processed
 */
export async function resolveWhenJobSettled(
  requestId: string
): Promise<"settled"> {
  const request = await requestDb.getRequestToRun(requestId);
  if (!request) {
    const captureRequestJob = await getQueue(WORKER_NAME).getJob(
      getRequestJobIdForRequestId(requestId)
    );
    if (!captureRequestJob) {
      throw new Error("no request found");
    }
    await captureRequestJob.waitUntilFinished(getQueueEvents(WORKER_NAME));
  }
  const secondRequestCheck = await requestDb.getRequestToRun(requestId);
  if (!secondRequestCheck) {
    throw new Error("no request found after second request check");
  }
  const { versionId, hookId } = await hookDb.getCodeByWriteKey(
    secondRequestCheck.writeKey
  );
  const stateExists = await stateDb.doesStateExist({
    requestId,
    versionId,
    hookId,
  });
  if (stateExists) {
    return "settled";
  }
  const queueName = queueNameForHookId(hookId);
  const job = await getQueue(queueName).getJob(
    getRunnerJobIdForRequestId(requestId)
  );
  if (!job) {
    throw new Error("neither in db or enqueued... possible dropped request");
  }
  await job.waitUntilFinished(getQueueEvents(queueName));
  const stateExistsAgain = await stateDb.doesStateExist({
    requestId,
    versionId,
    hookId,
  });
  if (stateExistsAgain) {
    return "settled";
  }
  throw new Error("state does not exist after runner job has completed");
}
