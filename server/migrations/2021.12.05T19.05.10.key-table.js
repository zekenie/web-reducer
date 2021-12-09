/** @type {import('@sloink/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    create table key (
      id uuid primary key default uuid_generate_v4(),
      "createdAt" timestamptz not null default NOW(),
      "type" varchar not null,
      "key" varchar not null,
      "hookId" uuid not null,
      foreign key("hookId") references hook("id"),
      unique("key")
    )
  `);
};

/** @type {import('@sloink/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`drop table key`);
};
