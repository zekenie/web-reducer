import { sql } from "slonik";
import { getPool } from "./";

export async function heartbeat() {
  await getPool().many(sql`
    SELECT 1 + 1;
  `);
}
