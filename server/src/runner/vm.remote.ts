import axios from "axios";
import { IncomingHttpHeaders } from "http";
import { WebhookRequest } from "../request/types";

const client = axios.create({
  baseURL: process.env.RUNNER_URL,
});

type CodeResponse = {
  ms: number;
  error?: { name: string; message: string; stacktrace?: string };
  state: unknown;
};

export async function runCode({
  code,
  request,
  state,
}: {
  code: string;
  request: WebhookRequest;
  state: unknown;
}): Promise<CodeResponse> {
  const { data } = await client.post<CodeResponse>("/", {
    code,
    requestJson: JSON.stringify(request),
    state: JSON.stringify(state),
  });
  return data;
}

export async function runCodeBulk({
  code,
  requests,
  state,
}: {
  code: string;
  requests: WebhookRequest[];
  state: unknown;
}): Promise<CodeResponse[]> {
  const { data } = await client.post<CodeResponse[]>("/", {
    code,
    requestsJson: JSON.stringify(requests),
    state: JSON.stringify(state),
  });
  return data;
}
