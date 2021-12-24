/** @type {import('@slonik/migrator').Migration} */
exports.up = async ({ context: { connection, sql } }) => {
  await connection.query(sql`drop index "onlyOneVersionPublished"`);
  await connection.query(sql`
    CREATE UNIQUE INDEX "onlyOneVersionPublishedAndDraft" ON version ("workflowState", "hookId") WHERE ("workflowState" = any(array['published', 'draft']));
  `);
};

/** @type {import('@slonik/migrator').Migration} */
exports.down = async ({ context: { connection, sql } }) => {
  await connection.query(sql`drop index "onlyOneVersionPublishedAndDraft"`);
  await connection.query(sql`
    CREATE UNIQUE INDEX "onlyOneVersionPublished" ON version ("workflowState", "hookId") WHERE ("workflowState" = 'published');
  `);
};
