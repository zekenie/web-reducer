import { uniqueId } from "lodash";

export function formatRequest(
  {
    headers = {},
    body = {},
    queryString = "",
    id = uniqueId(),
  }: {
    headers?: unknown;
    queryString?: string;
    body?: unknown;
    id?: string;
  } = {
    headers: {},
    body: {},
    queryString: "",
    id: uniqueId(),
  }
) {
  return `[${JSON.stringify({ headers, body, id, queryString })}]`;
}

export function formatRequests(
  requests: {
    queryString?: string;
    headers?: unknown;
    body?: unknown;
    id?: string;
  }[]
) {
  requests = requests.map((r) => ({
    body: {},
    headers: {},
    queryString: "",
    id: uniqueId(),
    ...r,
  }));
  return JSON.stringify(requests);
}
