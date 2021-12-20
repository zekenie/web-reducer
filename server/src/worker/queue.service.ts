import { Job, Queue as BullQueue } from "bullmq";
import "../request/request.worker";
import "../runner/runner.worker";
import { getMapper, getQueue } from "./queues";
import { JobDescription } from "./types";

// need queues
export async function enqueue(job: JobDescription): Promise<Job> {
  const mapper = getMapper(job.name);
  const queue = getQueue(mapper(job));
  return queue.add(job.name, job.input);
}

// enqueue({ name: "runInVM", input: { code: "asfd", state: "asdf" } });
// enqueue({ name: "run-hook", input: { foo: "asdf" } });
