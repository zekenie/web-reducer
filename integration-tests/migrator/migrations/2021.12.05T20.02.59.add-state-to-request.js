/** @type {import('@sloink/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table request add column "state" json not null default '{}'
  `);
};

/** @type {import('@sloink/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`alter table request drop column "state"`);
};
