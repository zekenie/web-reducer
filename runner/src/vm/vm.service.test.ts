import { formatRequest, formatRequests } from "./test-helpers";
import { runCode } from "./vm.service";

describe("responder", () => {
  it("runs hello world", () => {
    const helloWorld = `
      function responder(request) {
        return {
          statusCode: 200,
          body: { hello: 'world' }
        }
      }
    `;

    expect(
      runCode({
        secretsJson: "{}",
        mode: "response",
        code: helloWorld,
        requestsJson: formatRequest(),
        invalidIdempotencyKeys: [],
        state: "{}",
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ms: expect.any(Number),
          error: null,
          response: {
            statusCode: 200,
            body: { hello: "world" },
          },
        }),
      ])
    );
  });

  it("does not run reducer", () => {
    const code = `
      function reducer() {
        return { foo: 'bar' }
      }
      function responder(request) {
        return {
          statusCode: 200,
          body: { hello: 'world' }
        }
      }
    `;

    expect(
      runCode({
        secretsJson: "{}",
        mode: "response",
        code: code,
        requestsJson: formatRequest(),
        invalidIdempotencyKeys: [],
        state: "{}",
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ms: expect.any(Number),
          state: undefined,
          error: null,
          response: {
            statusCode: 200,
            body: { hello: "world" },
          },
        }),
      ])
    );
  });

  it("returns errors with stack and message", () => {
    const program = `                  // line 1
      function responder(request) {    // line 2
        throw new TypeError('oh no')   // line 3
      }
    `;
    expect(
      runCode({
        secretsJson: "{}",
        mode: "response",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          error: {
            message: "oh no",
            name: "TypeError",
            stacktrace: expect.stringContaining("hook.js:3"),
          },
          state: undefined,
        }),
      ])
    );
  });
});

describe("reducer", () => {
  it("runs hello world", () => {
    const helloWorld = `
      function reducer() {
        return "hello world"
      }
    `;
    expect(
      runCode({
        secretsJson: "{}",
        mode: "reducer",
        code: helloWorld,
        requestsJson: formatRequest(),
        invalidIdempotencyKeys: [],
        state: "{}",
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          state: "hello world",
          id: expect.any(String),
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
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          error: null,
          state: { number: 7 },
        }),
      ])
    );
  });

  it("has access to secret data", () => {
    const program = `
      function reducer(state, { body }, secrets) {
        return { number: secrets.num + state.number + body.number }
      }
    `;

    expect(
      runCode({
        secretsJson: `{"num": 1}`,
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          authentic: true,
          error: null,
          state: { number: 8 },
        }),
      ])
    );
  });

  it("is authentic when no `isAuthentic` function is passed", () => {
    const program = `
      function reducer(state, { body }) {
        return { number: state.number + body.number }
      }
    `;
    expect(
      runCode({
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          authentic: true,
          error: null,
          state: { number: 7 },
        }),
      ])
    );
  });

  it("is not authentic when `isAuthentic` returns false", () => {
    const program = `
      function isAuthentic() { return false; }
      function reducer(state, { body }) {
        return { number: state.number + body.number }
      }
    `;
    expect(
      runCode({
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          authentic: false,
          error: null,
          state: { number: 4 },
        }),
      ])
    );
  });

  it("is authentic when `isAuthentic` returns true", () => {
    const program = `
      function isAuthentic() { return true; }
      function reducer(state, { body }) {
        return { number: state.number + body.number }
      }
    `;
    expect(
      runCode({
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          authentic: true,
          error: null,
          state: { number: 7 },
        }),
      ])
    );
  });

  it("is not authentic when `isAuthentic` throws", () => {
    const program = `
      function isAuthentic() { throw new Error() }
      function reducer(state, { body }) {
        return { number: state.number + body.number }
      }
    `;
    expect(
      runCode({
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          authentic: false,
          error: {
            message: "",
            name: "Error",
            stacktrace: expect.stringContaining("hook.js:2"),
          },
          state: { number: 4 },
        }),
      ])
    );
  });

  it("finds idempotency tokens", () => {
    const program = `
  
      function getIdempotencyKey({ headers }) {
        return headers["x-idempotency-token"]
      }
  
      function reducer(state, { body }) {
        return { number: state.number + body.number }
      }
    `;
    expect(
      runCode({
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({
          headers: { "x-idempotency-token": "foo" },
          body: { number: 3 },
        }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          idempotencyKey: "foo",
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
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
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
      secretsJson: "{}",
      mode: "reducer",
      code: program,
      requestsJson: formatRequest({ body: { number: 3 } }),
      invalidIdempotencyKeys: [],
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
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      });
    }).toThrow("Script execution timed out after 250ms");
  });

  it("accepts multiple requests", () => {
    const program = `
    function reducer(state, { body }) {
      return { number: state.number + body.number }
    }
  `;
    const result = runCode({
      secretsJson: "{}",
      mode: "reducer",
      code: program,
      requestsJson: formatRequests([
        { body: { number: 3 } },
        { body: { number: 3 } },
      ]),
      invalidIdempotencyKeys: [],
      state: JSON.stringify({ number: 4 }),
    });
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          error: null,
          state: { number: 10 },
        }),
      ])
    );
  });
});

describe("console", () => {
  it("reports console artifacts", () => {
    const program = `
      function reducer(state, { body }) {
        console.log('log')
        console.info('info')
        console.error('error')
        console.warn('warn')
        console.trace('trace')
        return { number: state.number + body.number }
      }
    `;
    expect(
      runCode({
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequest({ body: { number: 3 } }),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          error: null,
          state: { number: 7 },
          console: expect.arrayContaining([
            expect.objectContaining({
              timestamp: expect.any(Number),
              messages: expect.arrayContaining(["log"]),
              level: "log",
            }),
            expect.objectContaining({
              timestamp: expect.any(Number),
              messages: expect.arrayContaining(["info"]),
              level: "info",
            }),
            expect.objectContaining({
              timestamp: expect.any(Number),
              messages: expect.arrayContaining(["error"]),
              level: "error",
            }),
            expect.objectContaining({
              timestamp: expect.any(Number),
              messages: expect.arrayContaining(["warn"]),
              level: "warn",
            }),
            expect.objectContaining({
              timestamp: expect.any(Number),
              messages: expect.arrayContaining(["trace"]),
              level: "trace",
            }),
          ]),
        }),
      ])
    );
  });

  it("has the correct artifacts upon multiple runs", () => {
    const program = `
      function reducer(state, { body }) {
        console.log(state.number + body.number)
        return { number: state.number + body.number }
      }
    `;
    expect(
      runCode({
        secretsJson: "{}",
        mode: "reducer",
        code: program,
        requestsJson: formatRequests([
          { body: { number: 3 } },
          { body: { number: 3 } },
        ]),
        invalidIdempotencyKeys: [],
        state: JSON.stringify({ number: 4 }),
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          error: null,
          state: { number: 7 },
          console: expect.arrayContaining([
            expect.objectContaining({
              timestamp: expect.any(Number),
              messages: expect.arrayContaining(["7"]),
              level: "log",
            }),
          ]),
        }),
        expect.objectContaining({
          id: expect.any(String),
          ms: expect.any(Number),
          error: null,
          state: { number: 10 },
          console: expect.arrayContaining([
            expect.objectContaining({
              timestamp: expect.any(Number),
              messages: expect.arrayContaining(["10"]),
              level: "log",
            }),
          ]),
        }),
      ])
    );
  });
});
