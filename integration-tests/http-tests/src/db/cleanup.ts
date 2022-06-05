import { memoize, uniq } from "lodash";
import { sql } from "slonik";
import { TopologicalSort } from "topological-sort";
import { getPool } from ".";
import dependencyOrders from "../../safe-dependency-order.json";

const conStrings = {
  server: process.env.DATABASE_URL!,
  secrets: process.env.SECRETS_DATABASE_URL!,
};

export async function cleanup(db: "server" | "secrets") {
  // const safeDependencyOrder = await getSafeDependencyOrder(con, uri);
  const safeDependencyOrder = dependencyOrders[db];
  const uri = conStrings[db];
  const pool = getPool("default", uri);

  for (const table of safeDependencyOrder) {
    await pool.any(sql`
      delete from ${sql.identifier([table])}
    `);
  }
}
