import { runCode } from "./vm.service";

function formatRequest(
  { headers = {}, body = {} }: { headers?: unknown; body?: unknown } = {
    headers: {},
    body: {},
  }
) {
  return `[${JSON.stringify({ headers, body })}]`;
}

function formatRequests(requests: { headers: unknown; body: unknown }) {
  return JSON.stringify(requests);
}

it("runs hello world", () => {
  const helloWorld = `
    function reducer() {
      return "hello world"
    }
  `;
  expect(
    runCode({
      code: helloWorld,
      requestsJSON: formatRequest(),
      state: "{}",
    })
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        state: "hello world",
        ms: expect.any(Number),
        error: null,
      }),
    ])
  );
});

it("works with state and event", () => {
  const program = `
    function reducer(state, { body }) {
      return { number: state.number + body.number }
    }
  `;
  expect(
    runCode({
      code: program,
      requestsJSON: formatRequest({ body: { number: 3 } }),
      state: JSON.stringify({ number: 4 }),
    })
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ms: expect.any(Number),
        error: null,
        state: { number: 7 },
      }),
    ])
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
      requestsJSON: formatRequest({ body: { number: 3 } }),
      state: JSON.stringify({ number: 4 }),
    })
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ms: expect.any(Number),
        error: {
          message: "oh no",
          name: "TypeError",
          stacktrace: expect.stringContaining("hook.js:3"),
        },
        state: { number: 4 },
      }),
    ])
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
    requestsJSON: formatRequest({ body: { number: 3 } }),
    state: JSON.stringify({ number: 4 }),
  });
  expect(JSON.stringify(result)).not.toContain("vm.service");
  expect(JSON.stringify(result)).not.toContain("vm2");
});

it("times out code that doesn't finish", () => {
  const program = `
    while(true) {}
    function reducer(state, event) {
    }
  `;

  expect(() => {
    runCode({
      code: program,
      requestsJSON: formatRequest({ body: { number: 3 } }),
      state: JSON.stringify({ number: 4 }),
    });
  }).toThrow("Script execution timed out after 250ms");
});
