import { Job } from "bullmq";
import "../request/request.worker";
import "../runner/runner.worker";
import { serializeCurrentSpan, tracingEvent } from "../tracing";
import { debug, getMapper, getQueue } from "./queues";
import { JobDescription } from "./types";
import { forWorkerType } from "./worker.metrics";

// need queues
export async function enqueue(
  job: JobDescription,
  jobId?: string
): Promise<Job> {
  const mapper = getMapper(job.name);
  const queue = getQueue(mapper(job));
  if (!queue) {
    console.error("NO QUEUE FOUND FOR JOB!");
    console.error(mapper(job));
    debug();
  }
  const enqueued = await queue.add(
    job.name,
    { ...job.input, _spanCarrier: serializeCurrentSpan() },
    { jobId }
  );
  forWorkerType("all").size.add(1);
  forWorkerType(job.name).size.add(1);
  // forWorkerType(enqueued.queueName).size.add(1);
  tracingEvent("wr.job.enqueued", {
    queue: enqueued.queueName,
    id: enqueued.id!,
  });
  return enqueued;
}

// enqueue({ name: "runInVM", input: { code: "asfd", state: "asdf" } });
// enqueue({ name: "run-hook", input: { foo: "asdf" } });
