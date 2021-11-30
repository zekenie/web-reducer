"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const server_1 = __importDefault(require("./server"));
require("./worker/all-workers");
(0, server_1.default)({}).listen(process.env.PORT);
