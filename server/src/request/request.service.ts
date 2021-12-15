import { IncomingHttpHeaders } from "http";
import { getCode } from "../hook/hook.db";
import { runCode } from "../runner/runner.service";
import { createState, fetchStateJSON } from "../state/state.db";

import { enqueue } from "../worker/queue.service";
import { getRequestToRun } from "./request.db";

export async function handleRequest({
  body,
  headers,
  requestId,
  contentType,
  writeKey,
}: {
  body: unknown;
  headers: IncomingHttpHeaders | Record<string, string>;
  requestId: string;
  contentType: string;
  writeKey: string;
}) {
  await enqueue({
    name: "request",
    input: {
      body,
      headers,
      requestId,
      contentType,
      writeKey,
    },
  });
}

export async function runHook(requestId: string): Promise<unknown> {
  const request = await getRequestToRun(requestId);
  const { versionId, hookId, code } = await getCode(request.writeKey);

  const stateJSON = await fetchStateJSON({ hookId, versionId });

  const { result, ms, error } = await runCode({
    code,
    state: stateJSON,
    event: request.body,
    headers: request.headers,
  });

  await createState({
    state: result as {},
    error,
    hookId,
    requestId,
    versionId,
    executionTime: ms,
  });

  return false;
}
