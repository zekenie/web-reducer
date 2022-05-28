import type { HttpJsonClient } from "./http-json-client.server";

const secretClientFactory = (httpClient: HttpJsonClient) => ({
  async list({ hookId }: { hookId: string }) {
    const data = await httpClient.get<{ secrets: Record<string, string> }>(
      `/secrets/${hookId}`
    );
    return data.secrets;
  },

  async set({
    key,
    value,
    hookId,
  }: {
    key: string;
    value: string;
    hookId: string;
  }): Promise<void> {
    await httpClient.post<void>(`/secrets/${hookId}`, { key, value });
  },

  async delete({ key, hookId }: { key: string; hookId: string }) {
    return httpClient.delete<void>(`/secrets/${hookId}?key=${key}`);
  },
});

export default secretClientFactory;
