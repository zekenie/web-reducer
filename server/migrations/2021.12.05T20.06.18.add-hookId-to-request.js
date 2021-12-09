/** @type {import('@sloink/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table request
      add column "hookId" uuid references hook("id"),
      add column "error" jsonb,
      add column "executionTime" int
  `);
};

/** @type {import('@sloink/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`alter table request drop column "hookId"`);
};
