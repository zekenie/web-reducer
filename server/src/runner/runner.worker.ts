import { registerNameMapper, registerQueue } from "../worker/queues";
import registerWorker from "../worker/register-worker";
import { runHook } from "./runner.service";

type WORKER_NAME = "run-hook";
const WORKER_NAME: WORKER_NAME = "run-hook";

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

const NUM_BUCKETS = 10;
for (let i = 0; i < NUM_BUCKETS; i++) {
  registerQueue(queueName(i));
  registerWorker(
    {
      concurrency: 1,
      name: WORKER_NAME,
      worker: async (j) => {
        console.log("running runner");
        await runHook(j.data.requestId);
      },
    },
    queueName(i)
  );
}

registerNameMapper(WORKER_NAME, (job) => {
  // this is hacky way to get type narrowing... will come up with
  // something better later
  if (job.name !== WORKER_NAME) {
    throw new Error("Mapper being used in wrong queue");
  }
  const bucket = hashStringToNumber(job.input.hookId, NUM_BUCKETS);
  return queueName(bucket);
});

function queueName(bucket: number) {
  return `${WORKER_NAME}-${bucket}`;
}

function hashStringToNumber(str: string, numBuckets: number): number {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num += str.charCodeAt(i);
  }
  return num % numBuckets;
}
