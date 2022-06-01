import type { HttpJsonClient } from "./http-json-client.server";

export type Credentials = {
  jwt: string;
  refreshToken: string;
};

export type User = {
  id: string;
  email?: string;
};

type UserWorkflowState = "guest" | "user";

export type UserDetails = User & {
  workflowState: UserWorkflowState;
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

  async me(): Promise<UserDetails> {
    return httpClient.get<UserDetails>("/auth/me");
  },
});

export default authClientFactory;
