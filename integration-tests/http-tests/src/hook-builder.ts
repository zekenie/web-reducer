import { first, uniqueId } from "lodash";
import { sql } from "slonik";
import {
  makeAuthenticatedServerClient,
  unauthenticatedServerClient,
} from "./clients";
import { getPool } from "./db";
import jwtLib from "jsonwebtoken";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { createHash } from "crypto";
import { allQueuesDrained } from "./server-internals";

export enum VersionWorkflowState {
  DRAFT = "draft",
  PUBLISHED = "published",
  OLD = "old",
}

export enum HookWorkflowState {
  LIVE = "live",
  PAUSED = "paused",
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

type Context = {
  jwt: string;
  writeKey: string;
  readKey: string;
  hookId: string;
};

export type RuntimeError = {
  name: string;
  message: string;
  stacktrace?: string;
};

type PaginatedHookHistory<PostBody, State> = Paginated<
  HookHistory<PostBody, State>
>;

type HookHistory<PostBody, State> = {
  state: State;
  body: PostBody;
  createdAt: number;
  error: RuntimeError | undefined;
};

type TemplateFields = any;

export type Template = {
  name: string;
  template: TemplateFields;
};

export type LogLevels = "warn" | "error" | "log" | "trace" | "debug" | "info";

export type ConsoleMessage = {
  level: LogLevels;
  messages: string[];
  timestamp: Date;
  requestId?: string;
};

type Paginated<T> = {
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

export function hashToken(token: string): string {
  const hash = createHash("sha256");
  hash.update(token, "utf-8");
  return hash.digest("hex");
}

export async function buildAuthenticatedApi(
  { guest }: { guest?: boolean } = { guest: false }
) {
  const emailAddress = `${uniqueId()}@gmail.com`;
  const refreshToken = uniqueId("my-token");

  const pool = getPool();
  const { id: userId } = await pool.one<{ id: string }>(
    guest
      ? sql`insert into "user" (id) values (default) returning id`
      : sql`
          insert into "user" (email) values (${emailAddress})
          returning id
        `
  );

  await getPool().any(sql`
      insert into "refreshToken"
      ("userId", "token", "createdAt")
      values
      (${userId}, ${hashToken(refreshToken)}, NOW())
    `);

  const jwt = jwtLib.sign({}, process.env.JWT_SECRET!, {
    subject: userId,
  });
  const authenticatedClient = makeAuthenticatedServerClient({
    jwt,
  });

  return {
    creds: { jwt, refreshToken },
    authenticatedClient,
    email: guest ? null : emailAddress,
    auth: {
      async signin(
        email: string = emailAddress,
        axiosConfig: AxiosRequestConfig = {}
      ) {
        return authenticatedClient.post("/auth/signin", { email }, axiosConfig);
      },
      async validateSigninToken(
        token: string,
        axiosConfig: AxiosRequestConfig = {}
      ) {
        return authenticatedClient.post(
          "/auth/validate-signin-token",
          { token },
          axiosConfig
        );
      },
    },
    hook: {
      async writeKey(
        key: string,
        body: any,
        axiosConfig: AxiosRequestConfig = {}
      ) {
        return unauthenticatedServerClient.post(`/write/${key}`, {
          data: JSON.stringify(body),
          ...axiosConfig,
        });
      },
      async readKey(key: string, axiosConfig: AxiosRequestConfig = {}) {
        return unauthenticatedServerClient.get(`/read/${key}`, {
          ...axiosConfig,
        });
      },
      async history<PostBody, State>(
        id: string,
        { nextToken }: { nextToken?: string } = {},
        axiosConfig: AxiosRequestConfig = {}
      ): Promise<AxiosResponse<PaginatedHookHistory<PostBody, State>>> {
        return authenticatedClient.get<PaginatedHookHistory<PostBody, State>>(
          `/hooks/${id}/history`,
          {
            params: { token: nextToken },
            ...axiosConfig,
          }
        );
      },
      async delete(id: string, axiosConfig?: AxiosRequestConfig) {
        return authenticatedClient.delete(`/hooks/${id}`, axiosConfig);
      },
      async update(
        id: string,
        updates: { code?: string; name?: string; description?: string },
        axiosConfig?: AxiosRequestConfig
      ) {
        return authenticatedClient.put(`/hooks/${id}`, updates, axiosConfig);
      },
      async create(axiosConfig?: AxiosRequestConfig) {
        return authenticatedClient.post<HookDetail>(`/hooks`, axiosConfig);
      },
      async read(id: string, axiosConfig?: AxiosRequestConfig) {
        return authenticatedClient.get(`/hooks/${id}`, axiosConfig);
      },
      async resetRequests(id: string, axiosConfig?: AxiosRequestConfig) {
        return authenticatedClient.post(
          `/hooks/${id}/reset-requests`,
          undefined,
          axiosConfig
        );
      },
      async publish(id: string, axiosConfig?: AxiosRequestConfig) {
        return authenticatedClient.post(
          `/hooks/${id}/publish`,
          undefined,
          axiosConfig
        );
      },

      async addKey({ hookId, type }: { hookId: string; type: string }) {
        const { data } = await authenticatedClient.post<{ key: string }>(
          `/hooks/${hookId}/keys`,
          { type }
        );
        return data.key;
      },

      async getKeys({ hookId }: { hookId: string }) {
        const { data } = await authenticatedClient.get<{ keys: KeyRecord[] }>(
          `/hooks/${hookId}/keys`
        );
        return data.keys;
      },
      async pauseKey({ hookId, key }: { hookId: string; key: string }) {
        await authenticatedClient.post(`/hooks/${hookId}/keys/${key}/pause`);
      },
      async playKey({ hookId, key }: { hookId: string; key: string }) {
        await authenticatedClient.post(`/hooks/${hookId}/keys/${key}/play`);
      },

      async templates({ hookId }: { hookId: string }) {
        const { data } = await authenticatedClient.get<{ keys: Template[] }>(
          `/hooks/${hookId}/templates`
        );
        return data.keys;
      },
    },
  };
}

function buildApi<PostBody, State>(context: Context) {
  const bodyToIdMap = new Map<PostBody, String>();
  let nextToken: string | undefined | null;

  const authenticatedClient = makeAuthenticatedServerClient({
    jwt: context.jwt,
  });

  return {
    async write(
      body: PostBody,
      queryParams?: Record<string, string>
    ): Promise<string> {
      const { data } = await unauthenticatedServerClient.post<{ id: string }>(
        `/write/${context.writeKey}`,
        body,
        { params: queryParams }
      );
      bodyToIdMap.set(body, data.id);
      return data.id;
    },

    async templates() {
      const { data } = await authenticatedClient.get(
        `/hooks/${context.hookId}/templates`
      );
      return data.templates;
    },

    async publish(): Promise<void> {
      await authenticatedClient.post(`/hooks/${context.hookId}/publish`);
    },

    async settled(requestIdOrPostBody: string | PostBody): Promise<void> {
      if (typeof requestIdOrPostBody === "string") {
        await unauthenticatedServerClient.get(
          `/write/${context.writeKey}/settled/${requestIdOrPostBody}`
        );
        return;
      }
      const id = bodyToIdMap.get(requestIdOrPostBody);
      if (!id) {
        throw new Error("post body not recognized");
      }
      await unauthenticatedServerClient.get(
        `/write/${context.writeKey}/settled/${id}`
      );
    },
    async setSecret(key: string, value: string): Promise<void> {
      await authenticatedClient.post(`/secrets/${context.hookId}`, {
        key,
        value,
      });
    },
    async deleteSecret(key: string): Promise<void> {
      await authenticatedClient.delete(`/secrets/${context.hookId}?key=${key}`);
    },
    async getSecrets(): Promise<Record<string, string>> {
      const { data } = await authenticatedClient.get(
        `/secrets/${context.hookId}`
      );
      return data.secrets;
    },
    async read(): Promise<State> {
      const { data } = await unauthenticatedServerClient.get<State>(
        `/read/${context.readKey}`
      );
      return data;
    },

    async hookDetails(): Promise<HookDetail> {
      const { data } = await authenticatedClient.get<HookDetail>(
        `/hooks/${context.hookId}`
      );
      return data;
    },

    async update(
      updates: Record<string, any>,
      axiosConfig?: AxiosRequestConfig
    ) {
      return authenticatedClient.put(
        `/hooks/${context.hookId}`,
        updates,
        axiosConfig
      );
    },
    async console({
      nextToken: nextConsoleToken,
    }: {
      nextToken?: string;
    } = {}): Promise<{ console: Paginated<ConsoleMessage> }> {
      const { data } = await authenticatedClient.get<{
        console: Paginated<ConsoleMessage>;
      }>(`/hooks/${context.hookId}/console`, {
        params: { token: nextConsoleToken },
      });

      return data;
    },
    async history(): Promise<PaginatedHookHistory<PostBody, State>> {
      const { data } = await authenticatedClient.get<
        PaginatedHookHistory<PostBody, State>
      >(`/hooks/${context.hookId}/history`, { params: { token: nextToken } });

      nextToken = data.nextToken;
      return data;
    },
  };
}

export async function buildHook<PostBody, State>({
  bodies,
  code = "function reducer (oldState = { number: 0 }, req) { return { number: oldState.number + req.body.number } }",
}: {
  bodies?: PostBody[];
  code?: string;
} = {}) {
  const authedApi = await buildAuthenticatedApi({});

  const hook = await authedApi.hook.create();
  await authedApi.hook.update(hook.data.id, { code });
  await authedApi.hook.publish(hook.data.id);
  await allQueuesDrained();

  const context: Context = {
    jwt: authedApi.creds.jwt,
    hookId: hook.data.id,
    writeKey: first(hook.data.writeKeys)!,
    readKey: first(hook.data.readKeys)!,
  };

  const api = buildApi<PostBody, State>(context);

  if (bodies) {
    for (const body of bodies) {
      await api.write(body);
    }
  }
  await allQueuesDrained();

  return { context, api, authenticatedClient: authedApi.authenticatedClient };
}
