import { registerNameMapper, registerQueue } from "../worker/queues";
import registerWorker from "../worker/workers";
import {
  NUM_BUCKETS,
  queueNameForBucket,
  queueNameForHookId,
} from "./runner-hash.helper";
import { runHook } from "./runner.service";
import { WORKER_NAME } from "./runner.types";

declare global {
  namespace Queue {
    interface WorkerTypes {
      [WORKER_NAME]: {
        name: WORKER_NAME;
        output: void;
        input: {
          requestId: string;
          hookId: string;
        };
      };
    }
  }
}

for (let i = 0; i < NUM_BUCKETS; i++) {
  registerQueue(queueNameForBucket(i));
  registerWorker<WORKER_NAME>(
    {
      concurrency: 1,
      name: WORKER_NAME,
      worker: async (j) => {
        await runHook(j.data.requestId);
      },
    },
    queueNameForBucket(i)
  );
}

registerNameMapper(WORKER_NAME, (job) => {
  // this is hacky way to get type narrowing... will come up with
  // something better later
  if (job.name !== WORKER_NAME) {
    throw new Error("Mapper being used in wrong queue");
  }
  return queueNameForHookId(job.input.hookId);
});
