/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`alter table "user" drop column "authNId"`);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "user" add column
    "authNId" integer not null
  `);
};
