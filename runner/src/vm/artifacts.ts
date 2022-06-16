import { formatStacktrace } from "../stacktrace/stacktrace.service";
import { LogLevels, VMConsole } from "./vm-console";
import { last } from "lodash";

type ConsoleMessage = {
  level: LogLevels;
  messages: string[];
  timestamp: number;
};

function formatError(
  error: Error | unknown | undefined,
  context: { filename: string; codeLength: number },
  offset: number
) {
  if (!error) {
    return null;
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stacktrace: formatStacktrace({
        error: error,
        programFile: context.filename,
        lineNumberMap: (num) => num - offset,
        lineNumberFilter: (line) => {
          return !line || line < context.codeLength + offset;
        },
      }),
    };
  } else {
    return { name: "Error", message: "unknown error" };
  }
}

export class Artifacts {
  public console: VMConsole = new VMConsole(this);
  private requestArtifacts: { [id: string]: RequestArtifact } = {};
  // for order
  private ids: string[] = [];

  private expectedLength: number;

  get done() {
    return this.allClosed && this.expectedLength === this.length;
  }

  get length() {
    return Object.values(this.requestArtifacts).length;
  }

  get allClosed() {
    return Object.values(this.requestArtifacts).every(
      (artifact) => !artifact.isOpen
    );
  }

  report({
    filename,
    codeLength,
    offset,
  }: {
    filename: string;
    codeLength: number;
    offset: number;
  }) {
    return this.ids
      .map((id) => this.requestArtifacts[id])
      .map((artifact) => artifact.report({ filename, codeLength, offset }));
  }

  expectLength(len: number) {
    this.expectedLength = len;
  }

  get latestArtifact() {
    const lastId = last(this.ids);
    if (lastId) {
      return this.requestArtifacts[lastId];
    }
    return null;
  }

  open(id: string) {
    // this.currentId = id;
    this.ids.push(id);
    this.requestArtifacts[id] = new RequestArtifact(id);
    return this.requestArtifacts[id];
  }
}

type VMResponse = {
  statusCode: number;
  body?: any;
  headers?: any;
};

class RequestArtifact {
  private open: boolean = true;
  private console: ConsoleMessage[] = [];

  private idempotencyKey?: string;
  private response?: VMResponse;
  private state?: unknown;
  private error?: Error | unknown | null;

  constructor(private readonly id: string) {}

  log(message: ConsoleMessage) {
    this.console.push(message);
  }

  isOpen() {
    return this.open;
  }

  close() {
    this.open = false;
    Object.freeze(this);
  }

  setResponse(res: VMResponse) {
    this.response = res;
  }

  setIdempotencyKey(key: string) {
    this.idempotencyKey = key;
  }

  setState(state: unknown) {
    this.state = state;
  }

  setError(err: Error | unknown | null) {
    this.error = err;
  }

  report({
    filename,
    codeLength,
    offset,
  }: {
    filename: string;
    codeLength: number;
    offset: number;
  }) {
    return {
      id: this.id,
      idempotencyKey: this.idempotencyKey,
      state: this.state,
      response: this.response,
      console: this.console,
      error: formatError(this.error, { filename, codeLength }, offset),
    };
  }
}
