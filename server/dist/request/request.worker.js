"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queues_1 = require("../worker/queues");
const register_worker_1 = __importDefault(require("../worker/register-worker"));
const request_db_1 = require("./request.db");
const WORKER_NAME = "request";
(0, register_worker_1.default)({
    concurency: 100,
    name: WORKER_NAME,
    worker: (j) => __awaiter(void 0, void 0, void 0, function* () {
        // save in db
        console.log("about to capture");
        yield (0, request_db_1.captureRequest)({
            id: j.data.requestId,
            contentType: j.data.contentType,
            body: j.data.body,
            writeKey: j.data.writeKey,
        });
        console.log("finished capture");
    }),
});
(0, queues_1.registerQueue)(WORKER_NAME);
