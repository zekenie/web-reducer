import { Job, Queue as BullQueue } from "bullmq";
import "../request/request.worker";
import "../runner/runner.worker";
import { debug, getMapper, getQueue } from "./queues";
import { JobDescription } from "./types";

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
  return queue.add(job.name, job.input, { jobId });
}

// enqueue({ name: "runInVM", input: { code: "asfd", state: "asdf" } });
// enqueue({ name: "run-hook", input: { foo: "asdf" } });
