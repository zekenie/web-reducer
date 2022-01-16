/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    create table "user" (
      id uuid primary key default uuid_generate_v4(),
      "createdAt" timestamptz not null default NOW(),
      "authNId" integer not null
    )
  `);

  await connection.query(sql`
    create table "access" (
      id uuid primary key default uuid_generate_v4(),
      "userId" uuid not null,
      "hookId" uuid not null,
      foreign key("hookId") references hook("id"),
      foreign key("userId") references "user"("id"),
      unique("hookId", "userId")
    )
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`drop table "access"`);
  await connection.query(sql`drop table "user"`);
};
