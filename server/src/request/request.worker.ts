import { IncomingHttpHeaders } from "http";
import { enqueue } from "../worker/queue.service";
import { registerQueue } from "../worker/queues";
import registerWorker from "../worker/workers";
import { captureRequest } from "./request.db";
import { WebhookRequest } from "./types";

type WORKER_NAME = "request";
const WORKER_NAME: WORKER_NAME = "request";

declare global {
  namespace Queue {
    interface WorkerTypes {
      [WORKER_NAME]: {
        name: WORKER_NAME;
        output: void;
        input: {
          requestId: string;
          contentType: string;
          request: WebhookRequest;
          writeKey: string;
        };
      };
    }
  }
}

registerWorker<WORKER_NAME>({
  concurrency: 100,
  name: WORKER_NAME,
  worker: async (j) => {
    const { requestId, hookId } = await captureRequest({
      id: j.data.requestId,
      contentType: j.data.contentType,
      request: j.data.request,
      writeKey: j.data.writeKey,
    });

    enqueue({
      name: "run-hook",
      input: {
        requestId,
        hookId,
      },
    });
  },
});

registerQueue(WORKER_NAME);

export {};
