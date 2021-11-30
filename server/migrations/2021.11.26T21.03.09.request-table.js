/** @type {import('@sloink/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    create table request (
      id uuid primary key default uuid_generate_v4(),
      "contentType" varchar not null,
      body jsonb not null,
      "writeKey" varchar not null,
      "createdAt" timestamptz not null default NOW()
    )
  `);
};

/** @type {import('@sloink/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`drop table request`);
};
