import { registerQueue } from "../worker/queues";

type WORKER_NAME = "run-hook";
const WORKER_NAME: WORKER_NAME = "run-hook";

declare global {
  namespace Queue {
    interface WorkerTypes {
      [WORKER_NAME]: {
        name: WORKER_NAME;
        output: {
          bar: "baz";
        };
        input: {
          foo: string;
        };
      };
    }
  }
}

registerQueue(WORKER_NAME);

export {};
