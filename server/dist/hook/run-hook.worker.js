"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queues_1 = require("../worker/queues");
const WORKER_NAME = "run-hook";
(0, queues_1.registerQueue)(WORKER_NAME);
