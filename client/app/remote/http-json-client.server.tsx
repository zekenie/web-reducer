import type { RequestInit } from "@remix-run/node";
import { fetch } from "@remix-run/node";
import { merge } from "lodash";

enum HttpMethods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export class HttpJsonClient {
  baseUrl?: string;
  baseConfig: Partial<RequestInit> = {};
  constructor({
    baseUrl,
    baseConfig = {},
  }: {
    baseUrl: string;
    baseConfig?: Partial<RequestInit>;
  }) {
    this.baseUrl = baseUrl;
    baseConfig.headers = { accept: "application/json", ...baseConfig.headers };
    this.baseConfig = baseConfig;
  }
  public async get<Res>(url: string) {
    return this.makeRequest<Res>(url, { method: HttpMethods.GET });
  }

  public patch<Res>(url: string, body?: unknown) {
    return this.makeRequest<Res>(url, {
      method: HttpMethods.PATCH,
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  public put<Res>(url: string, body?: unknown) {
    return this.makeRequest<Res>(url, {
      method: HttpMethods.PUT,
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  public post<Res>(url: string, body?: unknown) {
    return this.makeRequest<Res>(url, {
      method: HttpMethods.POST,
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  public async delete<Res>(url: string) {
    return this.makeRequest<Res>(url, { method: HttpMethods.DELETE });
  }
  private async makeRequest<T>(url: string, req: RequestInit) {
    if (this.baseUrl) {
      url = `${this.baseUrl}${url}`;
    }
    if (this.baseConfig) {
      merge(req, this.baseConfig);
    }
    const res = await fetch(url, req);

    const json = await res.json();

    if (res.status >= 400) {
      throw new HttpClientError(json.message as string, res.status);
    }

    return json as unknown as T;
  }
}

class HttpClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
