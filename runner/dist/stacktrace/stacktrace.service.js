"use strict";
// stacktracy
// https://github.com/patriksimek/vm2/issues/87
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatStacktrace = void 0;
const stacktracey_1 = __importDefault(require("stacktracey"));
function formatStacktrace({ error, programFile, lineNumberFilter = (n) => true, lineNumberMap = (n) => n, }) {
    const stacktracy = new stacktracey_1.default(error);
    return stacktracy
        .filter((line) => !line.thirdParty)
        .filter((line) => line.file === programFile)
        .filter((line) => {
        return lineNumberFilter(line.line);
    })
        .map((line) => {
        if (line.line) {
            line.line = lineNumberMap(line.line);
        }
        return line;
    })
        .asTable();
}
exports.formatStacktrace = formatStacktrace;
