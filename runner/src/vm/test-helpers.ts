import { uniqueId } from "lodash";

export function formatRequest(
  {
    headers = {},
    body = {},
    id = uniqueId(),
  }: { headers?: unknown; body?: unknown; id?: string } = {
    headers: {},
    body: {},
    id: uniqueId(),
  }
) {
  return `[${JSON.stringify({ headers, body, id })}]`;
}

export function formatRequests(
  requests: { headers?: unknown; body?: unknown; id?: string }[]
) {
  requests = requests.map((r) => ({
    body: {},
    headers: {},
    id: uniqueId(),
    ...r,
  }));
  return JSON.stringify(requests);
}
