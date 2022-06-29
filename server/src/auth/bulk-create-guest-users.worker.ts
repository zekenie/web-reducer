import { registerQueue } from "../worker/queues";
import registerWorker from "../worker/workers";
import { bulkInitiateGuestUsers } from "./auth.service";

type WORKER_NAME = "bulk-create-guest-users";
const WORKER_NAME: WORKER_NAME = "bulk-create-guest-users";

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
    return bulkInitiateGuestUsers({ n: 250 });
  },
});

registerQueue(WORKER_NAME);
