import { Job, Worker } from "bullmq";
import { connection } from "../redis";

type WorkerType<T extends keyof Queue.WorkerTypes> = {
  name: Queue.WorkerTypes[T]["name"];
  concurrency: number;
  worker: (
    job: Job<Queue.WorkerTypes[T]["input"], Queue.WorkerTypes[T]["output"]>
  ) => Promise<Queue.WorkerTypes[T]["output"]>;
};

const allWorkerFactories: (() => Worker)[] = [];

export default function registerWorker<T extends keyof Queue.WorkerTypes>(
  worker: WorkerType<T>,
  name: string = worker.name
) {
  allWorkerFactories.push(
    () =>
      new Worker<Queue.WorkerTypes[T]["input"], Queue.WorkerTypes[T]["output"]>(
        name,
        async (job) => {
          // wrapper code here...
          try {
            return worker.worker(job);
          } catch (e) {
            console.error(e);
            throw e;
          }
        },
        { concurrency: worker.concurrency, connection }
      )
  );
}

export function runWorkers() {
  return allWorkerFactories.map((fac) => fac());
}
