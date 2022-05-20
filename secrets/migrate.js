require("dotenv").config();
const { SlonikMigrator } = require("@slonik/migrator");
const { createPool } = require("slonik");

// in an existing slonik project, this would usually be setup in another module
const slonik = createPool(process.env.DATABASE_URL); // e.g. 'postgresql://postgres:postgres@localhost:5433/postgres'

const migrator = new SlonikMigrator({
  migrationsPath: __dirname + "/migrations",
  migrationTableName: "migration",
  slonik,
});

migrator.runAsCLI();
