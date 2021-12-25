import { Queue, QueueEvents } from "bullmq";
import { connection } from "../redis";
import { JobDescription } from "./types";
const queues: { [key: string]: Queue } = {};
const queueEvents: { [key: string]: QueueEvents } = {};

type Mapper = (job: JobDescription) => string;

const mappers: { [key: string]: Mapper } = {};

export function registerQueue(
  key: string,
  queue: Queue = new Queue(key, { connection }),
  queueEventsInstance: QueueEvents = new QueueEvents(key, { connection })
) {
  queues[key] = queue;
  queueEvents[key] = queueEventsInstance;
}

export function getQueue(key: string) {
  return queues[key];
}

export function getQueueEvents(key: string) {
  return queueEvents[key];
}

export function allQueues() {
  return Object.values(queues);
}

export function registerNameMapper(name: string, mapper: Mapper) {
  mappers[name] = mapper;
}

const defaultMapper: Mapper = (job) => job.name;

export function getMapper(name: string): Mapper {
  return mappers[name] || defaultMapper;
}
