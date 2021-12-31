import { NUM_BUCKETS, WORKER_NAME } from "./types";

export function hashWriteKeyToNumber(str: string): number {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num += str.charCodeAt(i);
  }
  return num % NUM_BUCKETS;
}

export function queueNameForWriteKey(writeKey: string): string {
  const bucket = hashWriteKeyToNumber(writeKey);
  return queueNameForBucket(bucket);
}

export function queueNameForBucket(bucket: number) {
  return `${WORKER_NAME}-${bucket}`;
}
