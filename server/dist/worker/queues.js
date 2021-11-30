"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapper = exports.registerNameMapper = exports.getQueue = exports.registerQueue = void 0;
const bullmq_1 = require("bullmq");
const queues = {};
const mappers = {};
function registerQueue(key, queue = new bullmq_1.Queue(key)) {
    queues[key] = queue;
}
exports.registerQueue = registerQueue;
function getQueue(key) {
    return queues[key];
}
exports.getQueue = getQueue;
function registerNameMapper(name, mapper) {
    mappers[name] = mapper;
}
exports.registerNameMapper = registerNameMapper;
const defaultMapper = (job) => job.name;
function getMapper(name) {
    return mappers[name] || defaultMapper;
}
exports.getMapper = getMapper;
