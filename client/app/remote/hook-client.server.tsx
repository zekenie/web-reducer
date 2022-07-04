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
  description: string;
  workflowState: HookWorkflowState;
  requestCount: number;
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
  headers: Record<string, string>;
  queryString: string;
  stateHash: string;
  body: unknown;
  bodyHash: string;
  error: RuntimeError;
  console: ConsoleMessage[];
  createdAt: Date;
};

export type PaginatedTokenResponse<T> = {
  nextToken: string | null;
  objects: T[];
};

export type KeyWorkflowState = "paused" | "live";
export type KeyType = "read" | "write";

export type KeyRecord = {
  key: string;
  workflowState: KeyWorkflowState;
  type: KeyType;
};

type TemplateFields = any;

export type Template = {
  name: string;
  template: TemplateFields;
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
    payload: { code?: string; name?: string; description?: string };
  }): Promise<void> {
    await httpClient.put(`/hooks/${id}`, payload);
  },

  async publish({ id }: { id: string }): Promise<void> {
    await httpClient.post(`/hooks/${id}/publish`);
  },

  async resetRequests({ id }: { id: string }): Promise<void> {
    await httpClient.post(`/hooks/${id}/reset-requests`);
  },

  async addKey({ id, type }: { id: string; type: string }) {
    const data = await httpClient.post<{ key: string }>(`/hooks/${id}/keys`, {
      type,
    });
    return data.key;
  },
  async getKeys({ id }: { id: string }): Promise<KeyRecord[]> {
    const { keys } = await httpClient.get<{ keys: KeyRecord[] }>(
      `/hooks/${id}/keys`
    );
    return keys;
  },

  async getTemplates({ id }: { id: string }): Promise<Template[]> {
    const { templates } = await httpClient.get<{ templates: Template[] }>(
      `/hooks/${id}/templates`
    );
    return templates;
  },

  async pauseKey({ id, key }: { id: string; key: string }) {
    await httpClient.post(`/hooks/${id}/keys/${key}/pause`);
  },
  async playKey({ id, key }: { id: string; key: string }) {
    await httpClient.post(`/hooks/${id}/keys/${key}/play`);
  },
});

export default hookClientFactory;
