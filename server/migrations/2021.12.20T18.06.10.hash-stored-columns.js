/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`alter table "version" drop column "hash"`);
  await connection.query(sql`alter table "state" drop column "hash"`);
  await connection.query(sql`
    alter table "version"
    add column "hash" text generated always as (encode(sha256(code::bytea), 'hex')) stored
  `);
  await connection.query(sql`
    alter table "state"
    add column "hash" text generated always as (encode(sha256(state::text::bytea), 'hex')) stored
  `);

  await connection.query(sql`
    alter table "request"
    add column "hash" text generated always as (encode(sha256(body::text::bytea), 'hex')) stored
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`alter table "request" drop column "hash"`);
  await connection.query(sql`alter table "version" drop column "hash"`);
  await connection.query(sql`alter table "state" drop column "hash"`);
  await connection.query(sql`
    alter table "version"
    add column "hash" text
  `);

  await connection.query(sql`
    alter table "state"
    add column "hash" text
  `);
};
