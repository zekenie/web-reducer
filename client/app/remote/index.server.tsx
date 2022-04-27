import type { Headers } from "@remix-run/node";
import authClientFactory from "./auth-client.server";
import hookClientFactory from "./hook-client.server";
import { HttpJsonClient } from "./http-json-client.server";

export function buildHttpClientForJwt(jwt?: string) {
  const headers = jwt ? { authorization: jwt } : ({} as Headers);
  return new HttpJsonClient({
    baseUrl: process.env.BACKEND_URL!,
    baseConfig: {
      headers,
    },
  });
}

export default function buildClientForJwt(jwt?: string) {
  const httpClient = buildHttpClientForJwt(jwt);

  return {
    auth: authClientFactory(httpClient),
    hooks: hookClientFactory(httpClient),
  };
}
