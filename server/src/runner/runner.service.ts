import axios from "axios";

const client = axios.create({
  baseURL: process.env.RUNNER_URL,
});

type CodeResponse = {
  ms: number;
  error: { name: string; message: string; stack: string };
  result: unknown;
};

export async function runCode({
  code,
  state,
  event,
}: {
  code: string;
  state: string;
  event: string;
}): Promise<CodeResponse> {
  const { data } = await client.post<CodeResponse>("/", { code, state, event });
  return data;
}
