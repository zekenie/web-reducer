import { enqueue } from "../worker/queue.service";
import { getQueue, getQueueEvents } from "../worker/queues";
import { WORKER_NAME as REQUEST_WORKER_NAME } from "./request.worker";
import { WebhookRequest } from "./types";

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
    request.id
  );
}

/**
 * This function returns a promise that resolves when a request
 * has been fully processed
 */
export async function resolveWhenJobSettled(requestId: string): Promise<void> {
  const job = await getQueue(REQUEST_WORKER_NAME).getJob(requestId);
  if (!job) {
    console.log(Date.now(), "no job found returning");
    return;
  }
  if (await job.isActive()) {
    console.log(Date.now(), "job is active");
    await job.waitUntilFinished(getQueueEvents(REQUEST_WORKER_NAME));
    console.log(Date.now(), "job is finished");
  }
}
