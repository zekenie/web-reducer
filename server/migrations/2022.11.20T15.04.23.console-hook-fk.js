/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "console"
    add column "hookId" uuid references hook("id")
  `);

  await connection.query(sql`
    update "console"
    set "hookId" = "request"."hookId"
    from "request"
    where "console"."requestId" = "request"."id"
  `);

  await connection.query(sql`
    alter table "console"
    alter column "hookId" set not null
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "console"
    drop column "hookId"
  `);
};
