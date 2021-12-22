import vm2 from "vm2";
import { formatStacktrace } from "../stacktrace/stacktrace.service";

type ConsoleMessage = {
  level: "warn" | "log" | "trace" | "debug" | "info";
  message: string | string[];
  timestamp: number;
};

class RequestArtifact {
  private open: boolean = true;
  private console: ConsoleMessage[];
  // console

  private idempotencyKey?: string;
  private state?: unknown;
  private error?: Error | unknown | null;
  private authentic: boolean = true;

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
    // ({
    //   state: artifact.,
    //   error: formatError(error, { filename, codeLength }),
    //   ms: Math.round(ms / results.length),
    // })
    return {
      state: this.state,
      error: formatError(this.error, { filename, codeLength }),
    };
  }

  // idempotency key
  // state
  // error
  // is authentic
  // tags?
}

class Artifacts {
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

  open(id: string) {
    // this.currentId = id;
    this.ids.push(id);
    this.requestArtifacts[id] = new RequestArtifact();
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
        lineNumberMap: (num) => num - 2,
        lineNumberFilter: (line) => !line || line < context.codeLength + 2,
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
  requestsJSON,
  filename = "hook.js",
}: {
  code: string;
  requestsJSON: string;
  state?: string;
  timeout?: number;
  filename?: string;
}) {
  const codeLength = code.split("\n").length;
  const artifacts = new Artifacts();
  const vm = new vm2.VM({ timeout, sandbox: { artifacts } });
  const start = new Date();
  let error: { message: string; name: string; stacktrace?: string } | null =
    null;
  const codeWithRuntime = `(function(state, requests) {
    artifacts.expectLength(requests.length)
    ${code}
    return requests.reduce((acc, request, i, requests) => {
      const frame = artifacts.open(request.id);
      const head = acc[acc.length - 1] || { state: state };
      try {
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
