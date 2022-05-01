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

type RescueErrorCb = (error: HttpClientError) => Promise<void>;

export class HttpJsonClient {
  baseUrl?: string;
  baseConfig: Partial<RequestInit> = {};
  rescueErrorCb?: RescueErrorCb;
  constructor({
    baseUrl,
    baseConfig = {},
  }: {
    baseUrl: string;
    baseConfig?: Partial<RequestInit>;
  }) {
    this.baseUrl = baseUrl;
    baseConfig.headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      ...baseConfig.headers,
    };
    this.baseConfig = baseConfig;
  }

  public headers(headers: RequestInit["headers"]) {
    this.baseConfig = {
      ...this.baseConfig,
      headers: { ...this.baseConfig.headers, ...headers },
    };
  }

  public rescueError(fn: RescueErrorCb) {
    this.rescueErrorCb = fn;
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
  private async makeRequest<T>(url: string, req: RequestInit): Promise<T> {
    if (this.baseUrl) {
      url = `${this.baseUrl}${url}`;
    }
    if (this.baseConfig) {
      merge(req, this.baseConfig);
    }
    const res = await fetch(url, req);

    const json = await res.json();

    if (res.status >= 400) {
      // @ts-expect-error
      const err = new HttpClientError(json.message as string, res.status, json);
      if (this.rescueErrorCb) {
        await this.rescueErrorCb(err);
        return this.makeRequest(url, {
          ...req,
          headers: { ...req.headers, ...this.baseConfig.headers },
        }) as unknown as T;
      }
      throw err;
    }

    return json as unknown as T;
  }
}

class HttpClientError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message + JSON.stringify(body, null, 2));
    this.status = status;
    this.body = body;
  }
}
