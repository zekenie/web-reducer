import vm2 from "vm2";
import { formatStacktrace } from "../stacktrace/stacktrace.service";

export function runCode({
  code,
  body,
  state,
  headers,
  timeout = 250,
  filename = "hook.js",
}: {
  code: string;
  body: string;
  state: string;
  headers: string;
  timeout?: number;
  filename?: string;
}) {
  const codeLength = code.split("\n").length;
  const vm = new vm2.VM({ timeout });
  const start = new Date();
  let error: { message: string; name: string; stacktrace?: string } | null =
    null;
  let result = null;
  const request = `{ "body": ${body}, "headers": ${headers}}`;
  try {
    result = vm.run(
      `(function(state, event) {
      ${code}
      return reducer(state, event);
    })(${state}, ${request})`,
      filename
    );
  } catch (e: unknown) {
    if (e instanceof Error) {
      error = {
        message: e.message,
        name: e.name,
        stacktrace: formatStacktrace({
          error: e,
          programFile: filename,
          lineNumberMap: (num) => num - 1,
          lineNumberFilter: (line) => !line || line < codeLength + 1,
        }),
      };
    } else {
      e = { name: "Error", message: "unknown error" };
    }
  }
  const end = new Date();
  const ms = end.getTime() - start.getTime();

  if (!error && !result && ms >= 249) {
    error = {
      name: "TimeoutError",
      message: "Code has timed out",
    };
  }

  return {
    ms,
    result,
    error,
  };
}
