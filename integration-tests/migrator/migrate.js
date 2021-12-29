const { SlonikMigrator } = require("@slonik/migrator");
const { createPool } = require("slonik");

// in an existing slonik project, this would usually be setup in another module
const slonik = createPool(process.env.DATABASE_URL); // e.g. 'postgresql://postgres:postgres@localhost:5433/postgres'

const migrator = new SlonikMigrator({
  migrationsPath: __dirname + "/migrations",
  migrationTableName: "migration",
  slonik,
});

migrator.pending().then(() => {
  console.log("Migrated pending");
  // just to keep process going
  setInterval(() => {}, 100);
});

function closeGracefully(signal) {
  console.log(`*^!@4=> Received signal to terminate: ${signal}`);

  server.close(() => {
    // await db.close() if we have a db connection in this app
    // await other things we should cleanup nicely
    process.exit();
  });
}
process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);
