"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCode = void 0;
const lodash_1 = require("lodash");
const vm2_1 = __importDefault(require("vm2"));
const stacktrace_service_1 = require("../stacktrace/stacktrace.service");
const levels = ["warn", "error", "log", "trace", "debug", "info"];
class VMConsole {
    constructor(artifacts) {
        this.artifacts = artifacts;
        for (const level of levels) {
            this[level] = (...messages) => {
                if (this.artifacts.latestArtifact)
                    this.artifacts.latestArtifact.log({
                        level,
                        messages: messages.map(this.formatMessage),
                        timestamp: Date.now(),
                    });
            };
        }
    }
    formatMessage(message) {
        if (typeof message === "object") {
            try {
                return JSON.stringify(message, null, 2);
            }
            catch (e) {
                return "[Unserializable object]";
            }
        }
        if (message.toString) {
            return message.toString();
        }
    }
}
class RequestArtifact {
    constructor(id) {
        this.id = id;
        this.open = true;
        this.console = [];
        this.authentic = true;
    }
    log(message) {
        this.console.push(message);
    }
    isOpen() {
        return this.open;
    }
    close() {
        this.open = false;
        Object.freeze(this);
    }
    setIdempotencyKey(key) {
        this.idempotencyKey = key;
    }
    setState(state) {
        this.state = state;
    }
    setError(err) {
        this.error = err;
    }
    setAuthentic(authentic) {
        this.authentic = authentic;
    }
    report({ filename, codeLength }) {
        return {
            id: this.id,
            idempotencyKey: this.idempotencyKey,
            authentic: this.authentic,
            state: this.state,
            console: this.console,
            error: formatError(this.error, { filename, codeLength }),
        };
    }
}
class Artifacts {
    constructor() {
        this.console = new VMConsole(this);
        this.requestArtifacts = {};
        // for order
        this.ids = [];
    }
    get done() {
        return this.allClosed && this.expectedLength === this.length;
    }
    get length() {
        return Object.values(this.requestArtifacts).length;
    }
    get allClosed() {
        return Object.values(this.requestArtifacts).every((artifact) => !artifact.isOpen);
    }
    report({ filename, codeLength }) {
        return this.ids
            .map((id) => this.requestArtifacts[id])
            .map((artifact) => artifact.report({ filename, codeLength }));
    }
    expectLength(len) {
        this.expectedLength = len;
    }
    get latestArtifact() {
        const lastId = (0, lodash_1.last)(this.ids);
        if (lastId) {
            return this.requestArtifacts[lastId];
        }
        return null;
    }
    open(id) {
        // this.currentId = id;
        this.ids.push(id);
        this.requestArtifacts[id] = new RequestArtifact(id);
        return this.requestArtifacts[id];
    }
}
function formatError(error, context) {
    if (!error) {
        return null;
    }
    if (error instanceof Error) {
        return {
            message: error.message,
            name: error.name,
            stacktrace: (0, stacktrace_service_1.formatStacktrace)({
                error: error,
                programFile: context.filename,
                lineNumberMap: (num) => num - 4,
                lineNumberFilter: (line) => !line || line < context.codeLength + 4,
            }),
        };
    }
    else {
        return { name: "Error", message: "unknown error" };
    }
}
function runCode({ code, state, timeout = 250, secretsJson, invalidIdempotencyKeys, requestsJson, filename = "hook.js", }) {
    const codeLength = code.split("\n").length;
    const artifacts = new Artifacts();
    const vm = new vm2_1.default.VM({
        timeout,
        sandbox: {
            artifacts,
            invalidIdempotencyKeys,
            console: artifacts.console,
            secrets: JSON.parse(secretsJson),
        },
    });
    const start = new Date();
    const codeWithRuntime = `(function(state, requests) {
    artifacts.expectLength(requests.length);
    function isAuthentic() { return true; }
    function getIdempotencyKey(request) { return request.id; }
    ${code}
    return requests.reduce((acc, request, i, requests) => {
      const frame = artifacts.open(request.id);
      const head = acc[acc.length - 1] || { state: state };

      let isAuthenticResult = null;
      let idempotencyKey = null;

      try {
      
        try {
          isAuthenticResult = isAuthentic(request)
          frame.setAuthentic(isAuthenticResult);
        } catch(e) {
          frame.setAuthentic(false);
          throw e;
        }
        
        idempotencyKey = getIdempotencyKey(request);
        frame.setIdempotencyKey(idempotencyKey);

        const shouldIgnoreRequest = !isAuthenticResult
          || invalidIdempotencyKeys.includes(idempotencyKey);

        if (shouldIgnoreRequest) {
          frame.setState(head.state);
          return [...acc, { error: null, state: head.state }];
        }

        const nextState = reducer(head.state, request);
        frame.setState(nextState);
        return [...acc, { error: null, state: nextState }];
      } catch(e) {
        frame.setError(e);
        frame.setState(head.state)
        return [...acc, { error: e, state: head.state }];
      }
    }, []);
  })(${state}, ${requestsJson})`;
    vm.run(codeWithRuntime, filename);
    const end = new Date();
    const ms = end.getTime() - start.getTime();
    if (!artifacts.done && ms >= timeout - 1) {
        throw new Error("timeout");
    }
    return artifacts.report({ codeLength, filename }).map((report) => (Object.assign(Object.assign({}, report), { ms: Math.round(ms / artifacts.length) })));
}
exports.runCode = runCode;
