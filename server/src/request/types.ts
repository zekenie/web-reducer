import { IncomingHttpHeaders } from "http";

export type WebhookRequest = {
  body: {};
  headers: IncomingHttpHeaders | Record<string, string>;
};
