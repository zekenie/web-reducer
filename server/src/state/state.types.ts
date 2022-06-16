import { ConsoleMessage, RuntimeError } from "../runner/runner.types";

export type StateHistory = {
  requestId: string;
  headers: Record<string, string>;
  queryString: string;
  state: unknown;
  body: unknown;
  error: RuntimeError | undefined;
  console: ConsoleMessage[];
  createdAt: Date;
};

export type StateHistoryContract = StateHistory & {
  bodyHash: string;
  stateHash: string;
};
