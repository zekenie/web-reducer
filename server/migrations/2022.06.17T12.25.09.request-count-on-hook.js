/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "hook"
    add column "requestCount" bigint not null default 0
  `);

  await connection.query(sql`
    with "requestCounts" as (
      select 
        "key"."hookId",
        count("request".*) as "count"
      from "key"
      join "request" on "request"."writeKey" = "key"."key"
      where "key"."type" = 'write'
      group by "key"."hookId"
    )
    update "hook"
    set "requestCount" = coalesce(
      (select "count" from "requestCounts" where "hookId" = "hook".id),
      0
    )
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table "hook"
    drop column "requestCount"
  `);
};
