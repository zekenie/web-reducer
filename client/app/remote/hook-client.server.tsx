import type { HttpJsonClient } from "./http-json-client.server";
export enum HookWorkflowState {
  LIVE = "live",
  PAUSED = "paused",
}
export enum VersionWorkflowState {
  DRAFT = "draft",
  PUBLISHED = "published",
  OLD = "old",
}

export type KeysByType = {
  writeKeys: string[];
  readKeys: string[];
};

export type HookCode = {
  [VersionWorkflowState.PUBLISHED]?: string;
  [VersionWorkflowState.DRAFT]: string;
};

export type HookDetail = HookOverview & KeysByType & HookCode;

export type HookOverview = {
  id: string;
  name: string;
  workflowState: HookWorkflowState;
  // requestCount: number;
};

export type RuntimeError = {
  name: string;
  message: string;
  stacktrace?: string;
};

type LogLevels = "warn" | "error" | "log" | "trace" | "debug" | "info";

export type ConsoleMessage = {
  level: LogLevels;
  messages: string[];
  timestamp: number;
};

export type Request = {
  requestId: string;
  state: unknown;
  stateHash: string;
  body: unknown;
  bodyHash: string;
  error: RuntimeError;
  console: ConsoleMessage;
  createdAt: Date;
};

export type PaginatedTokenResponse<T> = {
  nextToken: string | null;
  objects: T[];
};

const hookClientFactory = (httpClient: HttpJsonClient) => ({
  async list() {
    return httpClient.get<HookOverview[]>("/hooks");
  },
  async detail(id: string): Promise<HookDetail> {
    return httpClient.get<HookDetail>(`/hooks/${id}`);
  },
  async create(): Promise<HookDetail> {
    return httpClient.post<HookDetail>("/hooks");
  },

  async history(id: string, { token }: { token?: string } = {}) {
    const qs = token ? `?token=${token}` : "";
    return httpClient.get<PaginatedTokenResponse<Request>>(
      `/hooks/${id}/history${qs}`
    );
  },

  async update({
    id,
    payload,
  }: {
    id: string;
    payload: { code: string };
  }): Promise<void> {
    await httpClient.put(`/hooks/${id}`, payload);
  },

  async publish({ id }: { id: string }): Promise<void> {
    await httpClient.post(`/hooks/${id}/publish`);
  },
});

export default hookClientFactory;
