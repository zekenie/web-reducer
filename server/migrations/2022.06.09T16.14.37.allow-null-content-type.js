/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "request"
    alter column "contentType" drop not null
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    update "request"
    set "contentType" = 'application/json'
    where "contentType" is null
  `);
  await connection.query(sql`
    alter table "request"
    alter column "contentType" set not null
  `);
};
