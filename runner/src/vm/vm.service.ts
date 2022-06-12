import * as vmCrypto from "./vm-crypto.service";
import vm2 from "vm2";
import { Artifacts } from "./artifacts";

const sharedHeaderCode = `
requests = requests.map(req => ({ ...req, query: makeQueryParams(req.queryString) }))
artifacts.expectLength(requests.length);
function reducer() {}
function isAuthentic() { return true; }
function responder(request) {
  return {
    status: 202,
    body: { id: request.id }
  }
}
function getIdempotencyKey(request) { return request.id; }
`;

const codeBread = {
  response: {
    code: (code: string, requestsJson: string) =>
      `(function(requests) {
        ${sharedHeaderCode}
        (function() {
          ${code}
          for (const request of requests) {
            const frame = artifacts.open(request.id);
            try {
              frame.setResponse(responder(request));
            } catch(e) {
              frame.setError(e)
              frame.setResponse({
                statusCode: 500
              })
            }
          }
        })()
      })(${requestsJson})`,
    offset: 11,
  },
  reducer: {
    code: (
      code: string,
      state: string | undefined,
      requestsJson: string,
      secretsJson: string
    ) =>
      `(function(state, requests, secrets) {
        ${sharedHeaderCode}
        (function() {
          ${code}
          return requests.reduce((acc, request, i, requests) => {
            const frame = artifacts.open(request.id);
            const head = acc[acc.length - 1] || { state: state };

            let isAuthenticResult = null;
            let idempotencyKey = null;

            try {
              try {
                isAuthenticResult = isAuthentic(request, secrets)
                frame.setAuthentic(isAuthenticResult);
              } catch(e) {
                frame.setAuthentic(false);
                throw e;
              }
              
              idempotencyKey = getIdempotencyKey(request, secrets);
              frame.setIdempotencyKey(idempotencyKey);

              const shouldIgnoreRequest = !isAuthenticResult
                || invalidIdempotencyKeys.includes(idempotencyKey);

              if (shouldIgnoreRequest) {
                frame.setState(head.state);
                return [...acc, { error: null, state: head.state }];
              }

              const nextState = reducer(head.state, request, secrets);
              frame.setState(nextState);
              return [...acc, { error: null, state: nextState }];
            } catch(e) {
              frame.setError(e);
              frame.setState(head.state)
              return [...acc, { error: e, state: head.state }];
            }
          }, []);
        })()
      })(${state}, ${requestsJson}, ${secretsJson})`,
    offset: 11,
  },
};

export function runCode({
  code,
  state,
  timeout = 250,
  secretsJson,
  invalidIdempotencyKeys,
  requestsJson,
  mode,
  filename = "hook.js",
}: Readonly<{
  code: string;
  requestsJson: string;
  secretsJson: string;
  state?: string;
  invalidIdempotencyKeys: string[];
  timeout?: number;
  mode: "reducer" | "response"; // or side-effects?
  filename?: string;
}>) {
  const codeLength = code.split("\n").length;
  const artifacts = new Artifacts();
  const vm = new vm2.VM({
    allowAsync: false,
    wasm: false,
    timeout,
    sandbox: {
      artifacts,
      ...vmCrypto,
      makeQueryParams: (queryString: string) =>
        new URLSearchParams(queryString),
      invalidIdempotencyKeys,
      console: artifacts.console,
    },
  });
  const start = new Date();
  let codeWithRuntime;
  if (mode === "reducer") {
    codeWithRuntime = codeBread.reducer.code(
      code,
      state,
      requestsJson,
      secretsJson
    );
  } else if (mode === "response") {
    codeWithRuntime = codeBread.response.code(code, requestsJson);
  } else {
    throw new Error("invalid mode");
  }
  vm.run(codeWithRuntime, filename);

  const end = new Date();
  const ms = end.getTime() - start.getTime();

  if (!artifacts.done && ms >= timeout - 1) {
    throw new Error("timeout");
  }

  const ret = artifacts
    .report({ codeLength, filename, offset: codeBread[mode].offset })
    .map((report) => ({
      ...report,
      ms: Math.round(ms / artifacts.length),
    }));

  console.log(
    "console output",
    ...ret.map((r) => r.console.map((c) => c.messages))
  );

  return ret;
}
