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
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const bullmq_2 = require("bullmq");
const queueEvents = new bullmq_2.QueueEvents("Paint");
queueEvents.on("completed", ({ jobId, returnvalue }) => {
    console.log("failed", jobId, returnvalue);
    // Called every time a job is completed in any worker.
});
queueEvents.on("failed", ({ jobId, failedReason }) => {
    // jobId received a progress event
    console.log("failed", jobId, failedReason);
});
function registerWorker(worker) {
    console.log("registering worker ", worker);
    return new bullmq_1.Worker(worker.name, (job) => __awaiter(this, void 0, void 0, function* () {
        console.log("running worker", job);
        // wrapper code here...
        try {
            return worker.worker(job);
        }
        catch (e) {
            console.error(e);
        }
    }), { concurrency: worker.concurency });
}
exports.default = registerWorker;
// registerWorker<"runInVM">({
//   name: "runInVM",
//   worker: async (job) => {
//     return {
//       boof: "wer",
//     };
//   },
// });
