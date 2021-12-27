import { last } from "lodash";
import vm2 from "vm2";
import { formatStacktrace } from "../stacktrace/stacktrace.service";

type LogLevels = "warn" | "error" | "log" | "trace" | "debug" | "info";

const levels = ["warn", "error", "log", "trace", "debug", "info"] as Readonly<
  LogLevels[]
>;

type MessageLogger = (...messages: string[]) => void;

type ConsoleMessage = {
  level: LogLevels;
  messages: string[];
  timestamp: number;
};

class VMConsole {
  error: MessageLogger;
  warn: MessageLogger;
  log: MessageLogger;
  trace: MessageLogger;
  debug: MessageLogger;
  info: MessageLogger;
  constructor(private artifacts: Artifacts) {
    for (const level of levels) {
      this[level] = (...messages: string[]) => {
        if (this.artifacts.latestArtifact)
          this.artifacts.latestArtifact.log({
            level,
            messages,
            timestamp: Date.now(),
          });
      };
    }
  }
}

class RequestArtifact {
  private open: boolean = true;
  private consoleMessages: ConsoleMessage[] = [];

  private idempotencyKey?: string;
  private state?: unknown;
  private error?: Error | unknown | null;
  private authentic: boolean = true;

  constructor(private readonly id: string) {}

  log(message: ConsoleMessage) {
    this.consoleMessages.push(message);
  }

  isOpen() {
    return this.open;
  }

  close() {
    this.open = false;
    Object.freeze(this);
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

  setAuthentic(authentic: boolean) {
    this.authentic = authentic;
  }

  report({ filename, codeLength }: { filename: string; codeLength: number }) {
    return {
      id: this.id,
      idempotencyKey: this.idempotencyKey,
      authentic: this.authentic,
      state: this.state,
      consoleMessages: this.consoleMessages,
      error: formatError(this.error, { filename, codeLength }),
    };
  }
}

class Artifacts {
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

  report({ filename, codeLength }: { filename: string; codeLength: number }) {
    return this.ids
      .map((id) => this.requestArtifacts[id])
      .map((artifact) => artifact.report({ filename, codeLength }));
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

function formatError(
  error: Error | unknown | undefined,
  context: { filename: string; codeLength: number }
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
        lineNumberMap: (num) => num - 4,
        lineNumberFilter: (line) => !line || line < context.codeLength + 4,
      }),
    };
  } else {
    return { name: "Error", message: "unknown error" };
  }
}

export function runCode({
  code,
  state,
  timeout = 250,
  invalidIdempotencyKeys,
  requestsJSON,
  filename = "hook.js",
}: Readonly<{
  code: string;
  requestsJSON: string;
  state?: string;
  invalidIdempotencyKeys: string[];
  timeout?: number;
  filename?: string;
}>) {
  const codeLength = code.split("\n").length;
  const artifacts = new Artifacts();
  const vm = new vm2.VM({
    timeout,
    sandbox: { artifacts, invalidIdempotencyKeys, console: artifacts.console },
  });
  const start = new Date();
  const codeWithRuntime = `(function(state, requests) {
    artifacts.expectLength(requests.length);
    function isAuthentic() { return true; }
    function getIdempotencyKey(request) { return request.id; }
    ${code}
    return requests.reduce((acc, request, i, requests) => {
      const frame = artifacts.open(request.id);
      const head = acc[acc.length - 1] || { state: state };

      let isAuthenticResult = null;
      let idempotencyKey = null;

      try {
      
        try {
          isAuthenticResult = isAuthentic(request)
          frame.setAuthentic(isAuthenticResult);
        } catch(e) {
          frame.setAuthentic(false);
          throw e;
        }
        
        idempotencyKey = getIdempotencyKey(request);
        frame.setIdempotencyKey(idempotencyKey);

        const shouldIgnoreRequest = !isAuthenticResult
          || invalidIdempotencyKeys.includes(idempotencyKey);

        if (shouldIgnoreRequest) {
          frame.setState(head.state);
          return [...acc, { error: null, state: head.state }];
        }

        const nextState = reducer(head.state, request);
        frame.setState(nextState);
        return [...acc, { error: null, state: nextState }];
      } catch(e) {
        frame.setError(e);
        frame.setState(head.state)
        return [...acc, { error: e, state: head.state }];
      }
    }, []);
  })(${state}, ${requestsJSON})`;
  vm.run(codeWithRuntime, filename);

  const end = new Date();
  const ms = end.getTime() - start.getTime();

  if (!artifacts.done && ms >= timeout - 1) {
    throw new Error("timeout");
  }

  return artifacts.report({ codeLength, filename }).map((report) => ({
    ...report,
    ms: Math.round(ms / artifacts.length),
  }));
}
