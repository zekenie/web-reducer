/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    create table secret (
      id uuid primary key default uuid_generate_v4(),
      "namespaceId" uuid not null,
      "key" varchar not null,
      "value" varchar not null,
      "createdAt" timestamptz not null default NOW(),
      foreign key("namespaceId") references "namespace"("id"),
      unique("namespaceId", "key")
    )
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    drop table "secret"
  `);
};
