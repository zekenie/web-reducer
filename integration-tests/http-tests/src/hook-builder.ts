import { uniqueId } from "lodash";
import { sql } from "slonik";
import { serverClient } from "./clients";
import { getPool } from "./db";

type Context = {
  writeKey: string;
  readKey: string;
  hookId: string;
  versionId: string;
};

type PaginatedHookHistory<PostBody, State> = {
  nextToken: string | null;
  objects: { state: State; body: PostBody; createdAt: number }[];
};

function buildApi<PostBody, State>(context: Context) {
  const bodyToIdMap = new Map<PostBody, String>();
  let nextToken: string | undefined | null;
  return {
    async write(body: PostBody): Promise<string> {
      const { data } = await serverClient.post<{ id: string }>(
        `/${context.writeKey}`,
        body
      );
      bodyToIdMap.set(body, data.id);
      return data.id;
    },

    async settled(requestIdOrPostBody: string | PostBody): Promise<void> {
      if (typeof requestIdOrPostBody === "string") {
        await serverClient.get(`/settled/${requestIdOrPostBody}`);
        return;
      }
      const id = bodyToIdMap.get(requestIdOrPostBody);
      if (!id) {
        throw new Error("post body not recognized");
      }
      await serverClient.get(`/settled/${id}`);
    },
    async read(): Promise<State> {
      const { data } = await serverClient.get<State>(`/${context.readKey}`);
      return data;
    },
    async history(): Promise<PaginatedHookHistory<PostBody, State>> {
      const { data } = await serverClient.get<
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
  const pool = getPool();
  const { id: hookId } = await pool.one<{ id: string }>(sql`
    insert into hook (id) values (default)
    returning id
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
    hookId,
    versionId,
    writeKey,
    readKey,
  };

  const api = buildApi<PostBody, State>(context);

  if (bodies) {
    for (const body of bodies) {
      await api.write(body);
      await sleep(25);
    }
  }

  return { context, api };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
