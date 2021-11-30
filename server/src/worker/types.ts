export {};

declare global {
  namespace Queue {
    interface WorkerTypes {}
  }
}

export type JobDescription = Pick<
  Queue.WorkerTypes[keyof Queue.WorkerTypes],
  "name" | "input"
>;
