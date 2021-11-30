import vm2 from "vm2";

export function runCode({
  code,
  event,
  state,
  timeout = 250,
}: {
  code: string;
  event: unknown;
  state: Record<string, any>;
  timeout?: number;
}) {
  const vm = new vm2.VM({ sandbox: { state, event }, timeout });
  return vm.run(`
    (function(state, event) {
      ${code}
      return reducer(state, event);
    })(state, event)`);
}
