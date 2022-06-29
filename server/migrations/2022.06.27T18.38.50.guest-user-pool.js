/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    create table "guestUserPool" (
      id uuid primary key default uuid_generate_v4(),
      "userId" uuid not null,
      foreign key("userId") references "user"("id")
    )
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`drop table "guestUserPool"`);
};
