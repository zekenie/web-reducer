/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "hook"
    drop "code"
  `);

  await connection.query(sql`
    alter table "request"
      drop "state"
  `);

  await connection.query(sql`
    create table "version" (
      id uuid primary key default uuid_generate_v4(),
      code text not null,
      "workflowState" varchar not null,
      "createdAt" timestamptz not null default NOW(),
      "updatedAt" timestamptz not null default NOW(),
      "hookId" uuid,
      "hash" varchar not null,
      foreign key("hookId") references hook("id")
    )
  `);

  await connection.query(sql`
    CREATE UNIQUE INDEX "onlyOneVersionPublished" ON version ("workflowState", "hookId") WHERE ("workflowState" = any('published'));
  `);

  await connection.query(sql`
    create table "state" (
      id uuid primary key default uuid_generate_v4(),
      "createdAt" timestamptz not null default NOW(),
      state jsonb default '{}',
      "hash" varchar not null,
      "hookId" uuid not null,
      "requestId" uuid not null,
      "versionId" uuid,
      foreign key("hookId") references hook("id"),
      foreign key("versionId") references version("id"),
      foreign key("requestId") references request("id")

    )
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`drop table "state"`);
  await connection.query(sql`drop table "version"`);
  await connection.query(sql`
    alter table "hook"
      add column "code" text
  `);
  await connection.query(sql`
    alter table "request"
      add column state jsonb
  `);
};
