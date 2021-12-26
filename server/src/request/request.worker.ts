import { getRunnerJobIdForRequestId } from "../runner/runner.service";
import { enqueue } from "../worker/queue.service";
import { getQueue, getQueueEvents, registerQueue } from "../worker/queues";
import registerWorker from "../worker/workers";
import { captureRequest } from "./request.db";
import { WebhookRequest } from "./types";

type WORKER_NAME = "request";
export const WORKER_NAME: WORKER_NAME = "request";

declare global {
  namespace Queue {
    interface WorkerTypes {
      [WORKER_NAME]: {
        name: WORKER_NAME;
        output: void;
        input: {
          contentType: string;
          request: WebhookRequest;
          writeKey: string;
        };
      };
    }
  }
}

registerWorker<WORKER_NAME>({
  concurrency: 500,
  name: WORKER_NAME,
  worker: async (j) => {
    const { requestId, hookId } = await captureRequest({
      id: j.data.request.id,
      contentType: j.data.contentType,
      request: j.data.request,
      writeKey: j.data.writeKey,
    });

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
  },
});

registerQueue(WORKER_NAME);
