import { enqueue } from "../worker/queue.service";
import { WebhookRequest } from "./types";

export async function handleRequest({
  request,
  contentType,
  writeKey,
}: {
  request: WebhookRequest;
  contentType: string;
  writeKey: string;
}) {
  await enqueue({
    name: "request",
    input: {
      request,
      contentType,
      writeKey,
    },
  });
}
