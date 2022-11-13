import { ConsoleMessage } from "../console/console.types";
import { RuntimeError } from "../runner/runner.types";

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

// @todo versionId current allows null but it shouldn't

export type StateRow = {
  id: string;
  requestId: string;
  createdAt: Date;
  state: any;
  hookId: string;
  versionId: string;
  error?: any;
  executionTime: number;
  idempotencyKey?: string;
};
