/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "console"
    add column "number" bigint GENERATED ALWAYS AS IDENTITY not null
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "console"
    drop column "number";
  `);
};
