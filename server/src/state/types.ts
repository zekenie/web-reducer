import { ConsoleMessage, RuntimeError } from "../runner/types";

export type StateHistory = {
  requestId: string;
  state: unknown;
  body: unknown;
  error: RuntimeError;
  console: ConsoleMessage;
  createdAt: Date;
};
