"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCode = void 0;
const vm2_1 = __importDefault(require("vm2"));
function runCode({ code, event, state, timeout = 250, }) {
    const vm = new vm2_1.default.VM({ sandbox: { state, event }, timeout });
    return vm.run(`
    (function(state, event) {
      ${code}
      return reducer(state, event);
    })(state, event)`);
}
exports.runCode = runCode;
