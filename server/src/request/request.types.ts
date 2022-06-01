import { IncomingHttpHeaders } from "http";

export type WebhookRequest = {
  id: string;
  body: {};
  queryString: string;
  headers: IncomingHttpHeaders | Record<string, string>;
  createdAt: string;
};

export type WORKER_NAME = "request";
export const WORKER_NAME: WORKER_NAME = "request";
export const NUM_BUCKETS = 15;
