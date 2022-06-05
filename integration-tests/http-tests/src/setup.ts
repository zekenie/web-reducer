import { uniqueId } from "lodash";
import { getPool } from "./db";
import { cleanup } from "./db/cleanup";
import { clear } from "./server-internals";

export function serverTestSetup() {
  const id = uniqueId();
  const pool = getPool(id);
  beforeEach(async () => {
    await cleanup("server");
    await clear();
  });

  afterAll(async () => {
    await pool.end();
  });
}

export function secretsTestSetup() {
  beforeEach(async () => {
    await cleanup("secrets");
  });

  afterAll(async () => {
    return getPool("default", process.env.SECRETS_DATABASE_URL!).end();
  });
}
