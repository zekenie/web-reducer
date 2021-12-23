---
to: <%= absPath %>
---
import { registerQueue } from "../worker/queues";
import registerWorker from "../worker/workers";

type WORKER_NAME = "<%= workerName %>";
const WORKER_NAME: WORKER_NAME = "<%= workerName %>";

declare global {
  namespace Queue {
    interface WorkerTypes {
      [WORKER_NAME]: {
        name: WORKER_NAME;
        output: void;
        input: {};
      };
    }
  }
}

registerWorker<WORKER_NAME>({
  concurrency: 1,
  name: WORKER_NAME,
  worker: async (j) => {
    
  },
});

registerQueue(WORKER_NAME);
