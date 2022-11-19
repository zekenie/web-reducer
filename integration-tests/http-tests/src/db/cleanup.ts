import { sql } from "slonik";
import { getPool } from ".";

const conStrings = {
  server: process.env.DATABASE_URL!,
  secrets: process.env.SECRETS_DATABASE_URL!,
};

const tablesCache: { [table: string]: string[] } = {};

export async function cleanup(db: "server" | "secrets") {
  const uri = conStrings[db];
  const pool = getPool("default", uri);

  async function getTables() {
    if (tablesCache[db]) {
      return tablesCache[db];
    }

    const tables = await pool.many<{ table: string }>(sql`
    select table_name as "table" from information_schema.tables
    where table_schema = 'public'
    and table_name != 'migration'
  `);

    const tableNames = tables.map((t) => t.table);

    tablesCache[db] = tableNames;

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
