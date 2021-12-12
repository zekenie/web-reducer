import { runCode } from "./vm.service";

it("runs hello world", () => {
  const helloWorld = `
    function reducer() {
      return "hello world"
    }
  `;
  expect(
    runCode({
      code: helloWorld,
      event: "{}",
      state: "{}",
    })
  ).toEqual(
    expect.objectContaining({
      result: "hello world",
      ms: expect.any(Number),
      error: null,
    })
  );
});

it("works with state and event", () => {
  const program = `
    function reducer(state, event) {
      return { number: state.number + event.number }
    }
  `;
  expect(
    runCode({
      code: program,
      event: JSON.stringify({ number: 3 }),
      state: JSON.stringify({ number: 4 }),
    })
  ).toEqual(
    expect.objectContaining({
      ms: expect.any(Number),
      error: null,
      result: { number: 7 },
    })
  );
});

it("returns errors with stack and message", () => {
  const program = `                  // line 1
    function reducer(state, event) { // line 2
      throw new TypeError('oh no')   // line 3
    }
  `;
  expect(
    runCode({
      code: program,
      event: JSON.stringify({ number: 3 }),
      state: JSON.stringify({ number: 4 }),
    })
  ).toEqual(
    expect.objectContaining({
      ms: expect.any(Number),
      error: {
        message: "oh no",
        name: "TypeError",
        stacktrace: expect.stringContaining("hook.js:3"),
      },
      result: null,
    })
  );
});

it("filters out our code from stacktraces", () => {
  const program = `                  // line 1
    function reducer(state, event) { // line 2
      throw new TypeError('oh no')   // line 3
    }
  `;
  const result = runCode({
    code: program,
    event: JSON.stringify({ number: 3 }),
    state: JSON.stringify({ number: 4 }),
  });
  expect(result.error?.stacktrace).toEqual(
    expect.not.stringContaining("vm.service")
  );
  expect(result.error?.stacktrace).toEqual(expect.not.stringContaining("vm2"));
});

it("times out code that doesn't finish", () => {
  const program = `
    while(true) {}
    function reducer(state, event) {
    }
  `;
  const result = runCode({
    code: program,
    event: JSON.stringify({ number: 3 }),
    state: JSON.stringify({ number: 4 }),
  });

  expect(result.error?.name).toEqual("TimeoutError");
});
