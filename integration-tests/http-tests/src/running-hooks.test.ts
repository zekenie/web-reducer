import { uniqueId } from "lodash";
import { sql } from "slonik";
import { serverClient } from "./clients";
import { getPool } from "./db";
import { sleep } from "./utils";

const pool = getPool();

type Context = {
  writeKey: string;
  hookId: string;
  versionId: string;
};

async function cleanup() {
  await pool.any(sql`
    delete from "state" cascade
  `);

  await pool.any(sql`
    delete from "request" cascade
  `);

  await pool.any(sql`
    delete from "version" cascade
  `);

  await pool.any(sql`
    delete from "key" cascade
  `);

  await pool.any(sql`
    delete from "hook" cascade
  `);
}

describe("existing hooks", () => {
  let context: Context;
  beforeEach(async () => {
    await cleanup();
    const { id: hookId } = await pool.one<{ id: string }>(sql`
      insert into hook (id) values (default)
      returning id
    `);
    const code =
      "function reducer (oldState = { number: 0 }, req) { return { number: oldState.number + req.body.number } }";
    const { id: versionId } = await pool.one<{ id: string }>(sql`
      INSERT INTO "version" ("code","workflowState","createdAt","updatedAt","hookId")
      VALUES
      (${code}, 'published', NOW(), NOW() , ${hookId})
      returning id
    `);
    const { key: writeKey } = await pool.one<{ key: string }>(sql`
      insert into key (type, key, "hookId")
      values
      ('write', ${uniqueId("rand2")}, ${hookId})
      returning key
    `);
    context = {
      hookId,
      versionId,
      writeKey,
    };
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    return pool.end();
  });

  it("has a context", () => {
    expect(context).toEqual(
      expect.objectContaining({
        hookId: expect.any(String),
        versionId: expect.any(String),
        writeKey: expect.any(String),
      })
    );
  });

  it("accepts requests and eventually modifies the state", async () => {
    await serverClient.post(`/${context.writeKey}`, { number: 4 });
    await serverClient.post(`/${context.writeKey}`, { number: 3 });

    await sleep(250);

    const { state } = await pool.one<{ state: unknown }>(sql`
      select state from state
      where "versionId" = ${context.versionId}
      order by "createdAt" desc
      limit 1
    `);

    expect(state).toEqual({ number: 7 });
  });
});
