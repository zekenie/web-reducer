import axios from "axios";
import { IncomingHttpHeaders } from "http";
import { WebhookRequest } from "../request/types";

const client = axios.create({
  baseURL: process.env.RUNNER_URL,
  headers: { "content-type": "application/json" },
});

client.interceptors.response.use(
  (r) => {
    console.log(`success from runner`, r.data);
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
