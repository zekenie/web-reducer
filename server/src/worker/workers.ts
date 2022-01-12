import { Job, Worker } from "bullmq";
import { connection } from "../redis";
import { startActiveChildSpanFromRemoteParent } from "../tracing";
import { forWorkerType } from "./worker.metrics";

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
          await startActiveChildSpanFromRemoteParent(
            name,
            // @ts-expect-error
            job.data["_spanCarrier"],
            async () => {
              const start = Date.now();
              try {
                const result = await worker.worker(job);
                forWorkerType("all").succeeded.add(1);
                forWorkerType(name).succeeded.add(1);
                // forWorkerType(job.queueName).succeeded.add(1);
                return result;
              } catch (e) {
                console.error(e);
                forWorkerType("all").failed.add(1);
                forWorkerType(name).failed.add(1);
                // forWorkerType(job.queueName).failed.add(1);
                throw e;
              } finally {
                forWorkerType("all").size.add(-1);
                forWorkerType(name).size.add(-1);
                // forWorkerType(job.queueName).size.add(-1);
                const end = Date.now();
                const duration = end - start;
                forWorkerType("all").duration.record(duration);
                forWorkerType(name).duration.record(duration);
                // forWorkerType(job.queueName).duration.record(duration);
              }
            }
          );
        },
        { concurrency: worker.concurrency, connection }
      )
  );
}

export function runWorkers() {
  return allWorkerFactories.map((fac) => fac());
}
