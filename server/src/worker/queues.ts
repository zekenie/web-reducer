import { Queue } from "bullmq";
import { JobDescription } from "./types";
const queues: { [key: string]: Queue } = {};

type Mapper = (job: JobDescription) => string;

const mappers: { [key: string]: Mapper } = {};

export function registerQueue(key: string, queue: Queue = new Queue(key)) {
  queues[key] = queue;
}

export function getQueue(key: string) {
  return queues[key];
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
