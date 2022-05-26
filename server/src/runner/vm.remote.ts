import axios from "axios";
import { WebhookRequest } from "../request/request.types";
import { RunnerError } from "./runner.errors";
import { ConsoleMessage, RuntimeError } from "./runner.types";

const client = axios.create({
  baseURL: process.env.RUNNER_URL,
  headers: { "content-type": "application/json" },
});

client.interceptors.response.use(
  (r) => {
    return r;
  },
  (err) => {
    throw new RunnerError(err.response.data);
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
  secrets,
  state,
}: {
  code: string;
  request: WebhookRequest;
  state: unknown;
  secrets: Record<string, string>;
}): Promise<CodeResponse> {
  const res = await client.post<CodeResponse>("/", {
    code,
    requestJson: JSON.stringify(request),
    state: state ? JSON.stringify(state) : undefined,
    secretsJson: JSON.stringify(secrets),
  });
  return res.data;
}

export async function runCodeBulk({
  code,
  requests,
  idempotencyKeysToIgnore,
  secrets,
  state,
}: {
  code: string;
  requests: WebhookRequest[];
  idempotencyKeysToIgnore: string[];
  secrets: Record<string, string>;
  state: unknown;
}): Promise<CodeResponse[]> {
  const { data } = await client.post<CodeResponse[]>("/bulk", {
    code,
    requestsJson: JSON.stringify(requests),
    invalidIdempotencyKeys: idempotencyKeysToIgnore,
    state: JSON.stringify(state),
    secretsJson: JSON.stringify(secrets),
  });
  return data;
}
