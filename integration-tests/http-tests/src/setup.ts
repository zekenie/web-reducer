import { getPool } from "./db";
import { cleanup } from "./db/cleanup";
import { clear } from "./server-internals";

const pool = getPool();

export function serverTestSetup() {
  beforeEach(async () => {
    await cleanup();
    await clear();
  });

  afterAll(async () => {
    return pool.end();
  });
}

export function secretsTestSetup() {
  beforeEach(async () => {
    await cleanup(process.env.SECRETS_DATABASE_URL!);
  });

  afterAll(async () => {
    return getPool("default", process.env.SECRETS_DATABASE_URL!).end();
  });
}
