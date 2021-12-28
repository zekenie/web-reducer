export type RuntimeError = {
  name: string;
  message: string;
  stacktrace?: string;
};

type LogLevels = "warn" | "error" | "log" | "trace" | "debug" | "info";

export type ConsoleMessage = {
  level: LogLevels;
  messages: string[];
  timestamp: number;
};

export type WORKER_NAME = "run-hook";
export const WORKER_NAME: WORKER_NAME = "run-hook";
