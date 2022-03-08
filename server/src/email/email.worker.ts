import { registerQueue } from "../worker/queues";
import registerWorker from "../worker/workers";
import { sendMailSync } from "./email.service";

type WORKER_NAME = "email";
const WORKER_NAME: WORKER_NAME = "email";

declare global {
  namespace Queue {
    interface WorkerTypes {
      [WORKER_NAME]: {
        name: WORKER_NAME;
        output: void;
        input: Email.EmailTypes[keyof Email.EmailTypes] & { to: string };
      };
    }
  }
}

registerWorker<WORKER_NAME>({
  concurrency: 1,
  name: WORKER_NAME,
  worker: async (j) => {
    return sendMailSync({
      from: j.data.from,
      locals: j.data.locals,
      template: j.data.name,
      to: j.data.to,
    });
  },
});

registerQueue(WORKER_NAME);
