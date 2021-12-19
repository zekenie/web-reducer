import { enqueue } from "../worker/queue.service";
import { WebhookRequest } from "./types";

export async function handleRequest({
  request,
  requestId,
  contentType,
  writeKey,
}: {
  request: WebhookRequest;
  requestId: string;
  contentType: string;
  writeKey: string;
}) {
  await enqueue({
    name: "request",
    input: {
      request,
      requestId,
      contentType,
      writeKey,
    },
  });
}
