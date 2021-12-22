import { IncomingHttpHeaders } from "http";

export type WebhookRequest = {
  id: string;
  body: {};
  headers: IncomingHttpHeaders | Record<string, string>;
};
