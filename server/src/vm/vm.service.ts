import vm2 from "vm2";

export function runCode({
  code,
  event,
  state,
  timeout = 250,
}: {
  code: string;
  event: unknown;
  state: unknown;
  timeout?: number;
}) {
  const vm = new vm2.VM({ sandbox: { state, event }, timeout });
  const start = new Date();
  let error: Error | null = null;
  let result = null;
  try {
    result = vm.run(`
      (function(state, event) {
        ${code}
        return reducer(state, event);
      })(state, event)`);
  } catch (e) {
    error = e as Error;
  }
  const end = new Date();
  const ms = end.getTime() - start.getTime();

  return {
    ms,
    result,
    error,
  };
}
