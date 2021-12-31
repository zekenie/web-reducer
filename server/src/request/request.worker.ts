import { registerNameMapper, registerQueue } from "../worker/queues";
import registerWorker from "../worker/workers";
import { captureRequest } from "./request.service";
import { NUM_BUCKETS, WebhookRequest, WORKER_NAME } from "./types";
import {
  queueNameForBucket,
  queueNameForWriteKey,
} from "./request-hash.helper";

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

for (let i = 0; i < NUM_BUCKETS; i++) {
  const qName = queueNameForBucket(i);
  registerQueue(qName);
  registerWorker<WORKER_NAME>(
    {
      concurrency: 1,
      name: WORKER_NAME,
      worker: async (j) => {
        await captureRequest({
          id: j.data.request.id,
          contentType: j.data.contentType,
          request: j.data.request,
          writeKey: j.data.writeKey,
        });
      },
    },
    qName
  );
}

registerNameMapper(WORKER_NAME, (job) => {
  // this is hacky way to get type narrowing... will come up with
  // something better later
  if (job.name !== WORKER_NAME) {
    throw new Error("Mapper being used in wrong queue");
  }
  return queueNameForWriteKey(job.input.writeKey);
});
