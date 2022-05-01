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
      token,
    });
  },

  async signin({ email }: { email: string }): Promise<void> {
    await httpClient.post<{}>("/auth/signin", {
      email,
    });
  },

  async validateSigninToken({
    token,
  }: {
    token: string;
  }): Promise<Credentials> {
    return httpClient.post<Credentials>("/auth/validate-signin-token", {
      token,
    });
  },
});

export default authClientFactory;
