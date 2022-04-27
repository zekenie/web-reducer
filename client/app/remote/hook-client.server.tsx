import type { HttpJsonClient } from "./http-json-client.server";

export type HookOverview = {
  id: string;
};

const hookClientFactory = (httpClient: HttpJsonClient) => ({
  async listHooks() {
    return httpClient.get<HookOverview[]>("/hooks");
  },
  async createHook(): Promise<HookOverview> {
    const res = await httpClient.post<{
      hookId: string;
      writeKey: string;
      readKey: string;
    }>("/hooks");

    return { id: res.hookId };
  },
});

export default hookClientFactory;
