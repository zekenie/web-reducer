import type { HttpJsonClient } from "./http-json-client.server";

export type Credentials = {
  jwt: string;
  refreshToken: string;
};

const authClientFactory = (httpClient: HttpJsonClient) => ({
  async createGuestUser(): Promise<Credentials> {
    return httpClient.post<Credentials>("/auth/guest-user");
  },

  async refresh({ token }: { token: string }): Promise<Credentials> {
    return httpClient.post<Credentials>("/auth/refresh-token", {
      body: { token },
    });
  },

  async signin({ email }: { email: string }): Promise<void> {
    await httpClient.post<{}>("/auth/signin", {
      body: { email },
    });
  },

  async validateSigninToken({
    token,
  }: {
    token: string;
  }): Promise<Credentials> {
    return httpClient.post<Credentials>("/auth/validate-signin-token", {
      body: { token },
    });
  },
});

export default authClientFactory;
