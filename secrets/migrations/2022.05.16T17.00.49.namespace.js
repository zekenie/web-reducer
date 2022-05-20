/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);
  await connection.query(sql`
    create table namespace (
      id uuid primary key default uuid_generate_v4(),
      "accessKeyHash" varchar not null unique,
      "encryptionKey" varchar not null unique,
      "createdAt" timestamptz not null default NOW()
    )
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`drop table "namespace"`);
  await connection.query(sql`
    drop extension "uuid-ossp"
  `);
};
