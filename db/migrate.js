// db/migrate.js
// Creates tables (if they don't exist) and inserts sample data (if not
// already present). Runs automatically on every server startup, so a fresh
// VibeNest deploy just works with no manual step. Also runnable directly:
//   npm run migrate

const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);

  const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
  await pool.query(seed);

  console.log("Database schema is up to date, sample data present.");
}

module.exports = migrate;

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error("Migration failed:", err.message);
      process.exit(1);
    });
}
