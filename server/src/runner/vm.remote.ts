import axios from "axios";
import { WebhookRequest } from "../request/types";
import { ConsoleMessage, RuntimeError } from "./types";

const client = axios.create({
  baseURL: process.env.RUNNER_URL,
  headers: { "content-type": "application/json" },
});

client.interceptors.response.use(
  (r) => {
    return r;
  },
  (err) => {
    const response = err.response.data;
    console.error(response);
    throw err;
  }
);

type CodeResponse = {
  ms: number;
  error?: RuntimeError;
  state: unknown;
  id: string;
  idempotencyKey?: string;
  authentic: boolean;
  console: ConsoleMessage[];
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
  const res = await client.post<CodeResponse>("/", {
    code,
    requestJson: JSON.stringify(request),
    state: state ? JSON.stringify(state) : undefined,
  });
  return res.data;
}

export async function runCodeBulk({
  code,
  requests,
  idempotencyKeysToIgnore,
  state,
}: {
  code: string;
  requests: WebhookRequest[];
  idempotencyKeysToIgnore: string[];
  state: unknown;
}): Promise<CodeResponse[]> {
  const { data } = await client.post<CodeResponse[]>("/", {
    code,
    requestsJson: JSON.stringify(requests),
    idempotencyKeysToIgnore,
    state: JSON.stringify(state),
  });
  return data;
}
