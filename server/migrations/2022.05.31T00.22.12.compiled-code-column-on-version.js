/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "version"
    add column "compiledCode" text
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table version
    drop column "compiledCode"
  `);
};
