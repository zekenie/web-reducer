/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "signinToken"
    add column "guestUserId" uuid not null,
    add constraint "guestUserFk" foreign key("guestUserId") references "user"("id")
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "signinToken"
    drop column "guestUserId"
  `);
};
