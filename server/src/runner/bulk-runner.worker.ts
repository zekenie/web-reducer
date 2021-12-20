import { registerQueue } from "../worker/queues";
import registerWorker from "../worker/workers";
import { runBulk } from "./bulk-runner.service";

type WORKER_NAME = "bulk-run-hook";
const WORKER_NAME: WORKER_NAME = "bulk-run-hook";

declare global {
  namespace Queue {
    interface WorkerTypes {
      [WORKER_NAME]: {
        name: WORKER_NAME;
        output: void;
        input: {
          hookId: string;
        };
      };
    }
  }
}
registerQueue(WORKER_NAME);

registerWorker<WORKER_NAME>({
  concurrency: 25,
  name: WORKER_NAME,
  worker: async (j) => {
    await runBulk(j.data.hookId, (num) => {
      return j.updateProgress(num);
    });
  },
});
