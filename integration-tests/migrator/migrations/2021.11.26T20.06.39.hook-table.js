/** @type {import('@sloink/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);
  await connection.query(sql`
    create table hook (
      id uuid primary key default uuid_generate_v4(),
      code text not null,
      "createdAt" timestamptz not null default NOW()
    )
  `);
};

/** @type {import('@sloink/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    drop table hook
  `);

  await connection.query(sql`
    drop extension "uuid-ossp"
  `);
};
