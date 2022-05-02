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

const hookClientFactory = (httpClient: HttpJsonClient) => ({
  async listHooks() {
    return httpClient.get<HookOverview[]>("/hooks");
  },
  async getHook(id: string): Promise<HookDetail> {
    return httpClient.get<HookDetail>(`/hooks/${id}`);
  },
  async createHook(): Promise<HookDetail> {
    return httpClient.post<HookDetail>("/hooks");
  },
});

export default hookClientFactory;
