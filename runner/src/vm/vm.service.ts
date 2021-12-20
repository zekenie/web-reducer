import vm2 from "vm2";
import { formatStacktrace } from "../stacktrace/stacktrace.service";

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
        lineNumberMap: (num) => num - 1,
        lineNumberFilter: (line) => !line || line < context.codeLength + 1,
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
  const vm = new vm2.VM({ timeout });
  const start = new Date();
  let error: { message: string; name: string; stacktrace?: string } | null =
    null;
  const codeWithRuntime = `(function(state, requests) {
    ${code}
    return requests.reduce((acc, request, i, requests) => {
      const head = acc[acc.length - 1] || { state: state };
      try {
        const nextState = reducer(head.state, request);
        return [...acc, { error: null, state: nextState }];
      } catch(e) {
        return [...acc, { error: e, state: head.state }];
      }
    }, []);
  })(${state}, ${requestsJSON})`;
  const results: { error: Error | unknown | null; state: unknown }[] = vm.run(
    codeWithRuntime,
    filename
  );

  const end = new Date();
  const ms = end.getTime() - start.getTime();

  if (!error && !results && ms >= timeout - 1) {
    throw new Error("timeout");
  }
  return results.map(({ state, error }) => ({
    state,
    error: formatError(error, { filename, codeLength }),
    ms: Math.round(ms / results.length),
  }));
}
