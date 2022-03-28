import { uniqueId } from "lodash";
import { sql } from "slonik";
import {
  makeAuthenticatedServerClient,
  unauthenticatedServerClient,
} from "./clients";
import { getPool } from "./db";
import jwtLib from "jsonwebtoken";
import { AxiosRequestConfig, AxiosResponse } from "axios";

type Context = {
  jwt: string;
  writeKey: string;
  readKey: string;
  hookId: string;
  versionId: string;
};

type PaginatedHookHistory<PostBody, State> = {
  nextToken: string | null;
  objects: { state: State; body: PostBody; createdAt: number }[];
};

export async function buildAuthenticatedApi(jwt?: string) {
  if (!jwt) {
    const pool = getPool();
    const { id: userId } = await pool.one<{ id: string }>(sql`
      insert into "user" (email) values (${`${uniqueId()}@gmail.com`})
      returning id
    `);

    jwt = jwtLib.sign({}, process.env.JWT_SECRET!, {
      subject: userId,
    });
  }
  const authenticatedClient = makeAuthenticatedServerClient({
    jwt,
  });

  return {
    hook: {
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
      async updateHook(
        id: string,
        updates: Record<string, any>,
        axiosConfig?: AxiosRequestConfig
      ) {
        return authenticatedClient.put(`/hooks/${id}`, updates, axiosConfig);
      },
      async createHook(axiosConfig?: AxiosRequestConfig) {
        return authenticatedClient.post<{
          hookId: string;
          readKey: string;
          writeKey: string;
        }>(`/hooks`, axiosConfig);
      },
      async readHook(id: string, axiosConfig?: AxiosRequestConfig) {
        return authenticatedClient.get(`/hooks/${id}`, axiosConfig);
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
    async write(body: PostBody): Promise<string> {
      const { data } = await unauthenticatedServerClient.post<{ id: string }>(
        `/${context.writeKey}`,
        body
      );
      bodyToIdMap.set(body, data.id);
      return data.id;
    },

    async settled(requestIdOrPostBody: string | PostBody): Promise<void> {
      if (typeof requestIdOrPostBody === "string") {
        await unauthenticatedServerClient.get(
          `${context.writeKey}/settled/${requestIdOrPostBody}`
        );
        return;
      }
      const id = bodyToIdMap.get(requestIdOrPostBody);
      if (!id) {
        throw new Error("post body not recognized");
      }
      await unauthenticatedServerClient.get(
        `${context.writeKey}/settled/${id}`
      );
    },
    async read(): Promise<State> {
      const { data } = await unauthenticatedServerClient.get<State>(
        `/${context.readKey}`
      );
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
  email = `${uniqueId()}@test.com`,
}: {
  bodies?: PostBody[];
  code?: string;
  email?: string;
} = {}) {
  const pool = getPool();
  const { id: userId } = await pool.one<{ id: string }>(sql`
    insert into "user" (email) values (${email})
    returning id
  `);

  const jwt = jwtLib.sign({}, process.env.JWT_SECRET!, {
    subject: userId,
  });

  const { id: hookId } = await pool.one<{ id: string }>(sql`
    insert into hook (id) values (default)
    returning id
  `);

  await pool.any(sql`
    insert into "access"
    ("hookId", "userId")
    values
    (${hookId}, ${userId})
  `);

  const { id: versionId } = await pool.one<{ id: string }>(sql`
    INSERT INTO "version" ("code","workflowState","createdAt","updatedAt","hookId")
    VALUES
    (${code}, 'published', NOW(), NOW() , ${hookId})
    returning id
  `);
  const { key: writeKey } = await pool.one<{ key: string }>(sql`
  insert into key (type, key, "hookId")
    values
    ('write', ${uniqueId("rand")}, ${hookId})
    returning key
  `);
  const { key: readKey } = await pool.one<{ key: string }>(sql`
    insert into key (type, key, "hookId")
    values
    ('read', ${uniqueId("rand")}, ${hookId})
    returning key
  `);
  const context: Context = {
    jwt,
    hookId,
    versionId,
    writeKey,
    readKey,
  };

  const api = buildApi<PostBody, State>(context);

  if (bodies) {
    for (const body of bodies) {
      await api.write(body);
    }
  }

  return { context, api };
}
