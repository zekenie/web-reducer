import type { Headers } from "@remix-run/node";
import authClientFactory, { Credentials } from "./auth-client.server";
import hookClientFactory from "./hook-client.server";
import { HttpJsonClient } from "./http-json-client.server";
import secretClientFactory from "./secret-client.server";

/**
 * This file basically exists to merge HttpClient and credentials
 * and client methods for our specific api
 */

function buildHttpClientForJwt({ jwt }: { jwt?: string }) {
  const headers = jwt ? { authorization: jwt } : ({} as Headers);
  const client = new HttpJsonClient({
    baseUrl: process.env.BACKEND_URL!,
  });

  client.headers(headers);
  return client;
}

export default function buildClientForJwt(jwt: string) {
  const httpClient = buildHttpClientForJwt({ jwt });

  const auth = authClientFactory(httpClient);

  return {
    auth,
    hooks: hookClientFactory(httpClient),
    secrets: secretClientFactory(httpClient),
  };
}
