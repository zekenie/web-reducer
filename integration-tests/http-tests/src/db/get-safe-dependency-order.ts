import { uniq } from "lodash";
import { sql } from "slonik";
import TopologicalSort from "topological-sort";
import { getPool } from ".";

export default async function getSafeDependencyOrder(
  uri?: string
): Promise<string[]> {
  const graph = new TopologicalSort(new Map());
  const pool = getPool("default", uri);
  const rows = await pool.many<{
    table_schema: string;
    constraint_name: string;
    table_name: string;
    column_name: string;
    foreign_table_schema: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }>(
    sql`
    with all_foreign_keys as (
      SELECT
          tc.table_schema,
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
      FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
    )
    select table_name, foreign_table_name from all_foreign_keys
    where table_name != foreign_table_name
    and column_name != foreign_column_name
    group by table_name, foreign_table_name
  `
  );

  const allTables = uniq([
    ...rows.map((row) => row.table_name),
    ...rows.map((row) => row.foreign_table_name),
  ]);

  for (const table of allTables) {
    graph.addNode(table, table);
  }

  for (const row of rows) {
    graph.addEdge(row.table_name, row.foreign_table_name);
  }

  return [...graph.sort().keys()];
}
