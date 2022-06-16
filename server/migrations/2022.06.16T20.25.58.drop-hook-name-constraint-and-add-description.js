/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "hook"
    add column "description" text
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "hook"
    drop column description
  `);
};
