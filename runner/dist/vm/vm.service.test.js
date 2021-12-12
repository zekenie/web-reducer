"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vm_service_1 = require("./vm.service");
it("runs hello world", () => {
    const helloWorld = `
    function reducer() {
      return "hello world"
    }
  `;
    expect((0, vm_service_1.runCode)({
        code: helloWorld,
        event: "{}",
        state: "{}",
    })).toEqual(expect.objectContaining({
        result: "hello world",
        ms: expect.any(Number),
        error: null,
    }));
});
it("works with state and event", () => {
    const program = `
    function reducer(state, event) {
      return { number: state.number + event.number }
    }
  `;
    expect((0, vm_service_1.runCode)({
        code: program,
        event: JSON.stringify({ number: 3 }),
        state: JSON.stringify({ number: 4 }),
    })).toEqual(expect.objectContaining({
        ms: expect.any(Number),
        error: null,
        result: { number: 7 },
    }));
});
it("returns errors with stack and message", () => {
    const program = `                  // line 1
    function reducer(state, event) { // line 2
      throw new TypeError('oh no')   // line 3
    }
  `;
    expect((0, vm_service_1.runCode)({
        code: program,
        event: JSON.stringify({ number: 3 }),
        state: JSON.stringify({ number: 4 }),
    })).toEqual(expect.objectContaining({
        ms: expect.any(Number),
        error: {
            message: "oh no",
            name: "TypeError",
            stacktrace: expect.stringContaining("hook.js:3"),
        },
        result: null,
    }));
});
it("filters out our code from stacktraces", () => {
    var _a, _b;
    const program = `                  // line 1
    function reducer(state, event) { // line 2
      throw new TypeError('oh no')   // line 3
    }
  `;
    const result = (0, vm_service_1.runCode)({
        code: program,
        event: JSON.stringify({ number: 3 }),
        state: JSON.stringify({ number: 4 }),
    });
    expect((_a = result.error) === null || _a === void 0 ? void 0 : _a.stacktrace).toEqual(expect.not.stringContaining("vm.service"));
    expect((_b = result.error) === null || _b === void 0 ? void 0 : _b.stacktrace).toEqual(expect.not.stringContaining("vm2"));
});
