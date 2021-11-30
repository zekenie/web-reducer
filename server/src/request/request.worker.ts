import { registerQueue } from "../worker/queues";
import registerWorker from "../worker/register-worker";
import { captureRequest } from "./request.db";

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
          body: unknown;
          writeKey: string;
        };
      };
    }
  }
}

registerWorker<WORKER_NAME>({
  concurency: 100,
  name: WORKER_NAME,
  worker: async (j) => {
    await captureRequest({
      id: j.data.requestId,
      contentType: j.data.contentType,
      body: j.data.body as {},
      writeKey: j.data.writeKey,
    });
  },
});

registerQueue(WORKER_NAME);

export {};
