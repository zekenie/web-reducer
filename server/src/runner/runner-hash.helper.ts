import { WORKER_NAME } from "./runner.types";

export const NUM_BUCKETS = 10;

export function hashHookIdToNumber(str: string): number {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num += str.charCodeAt(i);
  }
  return num % NUM_BUCKETS;
}

export function queueNameForBucket(bucket: number) {
  return `${WORKER_NAME}-${bucket}`;
}

export function queueNameForHookId(hookId: string): string {
  const bucket = hashHookIdToNumber(hookId);
  return queueNameForBucket(bucket);
}

export function getRunnerJobIdForRequestId(reqId: string): string {
  return `${WORKER_NAME}-${reqId}`;
}
