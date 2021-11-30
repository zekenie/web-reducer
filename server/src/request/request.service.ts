import { enqueue } from "../worker/queue.service";

export async function handleRequest({
  body,
  requestId,
  contentType,
  writeKey,
}: {
  body: unknown;
  requestId: string;
  contentType: string;
  writeKey: string;
}) {
  await enqueue({
    name: "request",
    input: {
      body,
      requestId,
      contentType,
      writeKey,
    },
  });
}
