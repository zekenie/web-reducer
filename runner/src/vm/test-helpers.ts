export function formatRequest(
  { headers = {}, body = {} }: { headers?: unknown; body?: unknown } = {
    headers: {},
    body: {},
  }
) {
  return `[${JSON.stringify({ headers, body })}]`;
}

export function formatRequests(
  requests: { headers?: unknown; body?: unknown }[]
) {
  requests = requests.map((r) => ({ body: {}, headers: {}, ...r }));
  return JSON.stringify(requests);
}
