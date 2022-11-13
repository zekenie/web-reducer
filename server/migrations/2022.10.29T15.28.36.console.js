const { groupBy } = require("lodash");

/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    create table "console" (
      id uuid primary key default uuid_generate_v4(),
      "createdAt" timestamptz not null default NOW(),
      "updatedAt" timestamptz not null default NOW(),
      "timestamp" timestamptz not null,
      "requestId" uuid,
      "stateId" uuid,
      "level" varchar(25) not null,
      "messages" jsonb not null default '{}',
      foreign key("requestId") references request("id"),
      foreign key("stateId") references state("id")
    )
  `);

  const { rows } = await connection.query(sql`
    select id, "requestId", console from "state"
    where console != '[]'
  `);

  for (const row of rows) {
    const consoleMessages = row.console;
    for (const { messages, level, timestamp } of consoleMessages) {
      await connection.query(sql`
        insert into "console"
        ("timestamp", "level", "requestId", "stateId", "messages")
        values
        (${new Date(timestamp).toISOString()}, ${level}, ${row.requestId}, ${
        row.id
      }, ${sql.jsonb(messages)})
      `);
    }
  }

  await connection.query(sql`
    alter table "state"
    drop column console
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`
    alter table state
    add column console jsonb not null default '[]'
  `);

  const { rows } = await connection.query(sql`
    select * from "console"
  `);

  const consoleByState = groupBy(rows, "stateId");

  for (const stateId of Object.keys(consoleByState)) {
    const consoleArr = consoleByState[stateId].map((c) => ({
      level: c.level,
      messages: c.messages,
      timestamp: new Date(c.timestamp).getTime(),
    }));
    await connection.query(sql`
      update "state"
      set "console" = ${sql.json(consoleArr)}
      where id = ${stateId}
    `);
  }

  await connection.query(sql`
    drop table "console"
  `);
};
