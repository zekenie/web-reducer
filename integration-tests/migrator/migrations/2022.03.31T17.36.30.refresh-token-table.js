/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    create table "refreshToken" (
      id uuid primary key default uuid_generate_v4(),
      "createdAt" timestamptz not null default NOW(),
      "token" varchar not null,
      "userId" uuid not null,
      foreign key("userId") references "user"("id"),
      unique("token")
    )

  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`drop table "refreshToken"`);
};
