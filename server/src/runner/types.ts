export type RuntimeError = {
  name: string;
  message: string;
  stacktrace?: string;
};

export type WORKER_NAME = "run-hook";
export const WORKER_NAME: WORKER_NAME = "run-hook";
