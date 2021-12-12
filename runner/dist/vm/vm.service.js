"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCode = void 0;
const vm2_1 = __importDefault(require("vm2"));
const stacktrace_service_1 = require("../stacktrace/stacktrace.service");
function runCode({ code, event, state, timeout = 250, filename = "hook.js", }) {
    const codeLength = code.split("\n").length;
    const vm = new vm2_1.default.VM({ timeout });
    const start = new Date();
    let error = null;
    let result = null;
    try {
        result = vm.run(`(function(state, event) {
      ${code}
      return reducer(state, event);
    })(${state}, ${event})`, filename);
    }
    catch (e) {
        if (e instanceof Error) {
            error = {
                message: e.message,
                name: e.name,
                stacktrace: (0, stacktrace_service_1.formatStacktrace)({
                    error: e,
                    programFile: filename,
                    lineNumberMap: (num) => num - 1,
                    lineNumberFilter: (line) => !line || line < codeLength + 1,
                }),
            };
        }
        else {
            e = { name: "Error", message: "unknown error" };
        }
    }
    const end = new Date();
    const ms = end.getTime() - start.getTime();
    return {
        ms,
        result,
        error,
    };
}
exports.runCode = runCode;
