import { getPool } from "./db";
import { cleanup } from "./db/cleanup";
import { clear } from "./server-internals";

const pool = getPool();

export function testSetup() {
  beforeEach(async () => {
    await cleanup();
    await clear();
  });

  afterAll(async () => {
    return pool.end();
  });
}
