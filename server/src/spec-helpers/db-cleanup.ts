import { sql } from "slonik";
import { getPool } from "../db";

let tablesCache: string[];

export async function cleanup() {
  const pool = getPool();

  async function getTables() {
    if (tablesCache) {
      return tablesCache;
    }

    const tables = await pool.many<{ table: string }>(sql`
    select table_name as "table" from information_schema.tables
    where table_schema = 'public'
    and table_name != 'migration'
  `);

    const tableNames = tables.map((t) => t.table);

    tablesCache = tableNames;

    return tableNames;
  }

  const tableNames = await getTables();

  await pool.any(sql`
    truncate table ${sql.join(
      tableNames.map((table) => sql.identifier([table])),
      sql`, `
    )} CASCADE
  `);
}
