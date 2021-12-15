/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "request"
      drop "error", drop "executionTime"
  `);
  await connection.query(sql`
    alter table "state"
      add column "error" jsonb,
      add column "executionTime" integer not null
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  // await connection.query(sql`raise 'down migration not implemented'`)
  await connection.query(sql`
    alter table "state"
      drop "error", drop "executionTime"
  `);
  await connection.query(sql`
    alter table "request"
      add column "error" jsonb,
      add column "executionTime" integer not null
  `);
};
