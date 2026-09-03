// db/migrate.js
// Creates tables (if they don't exist) and inserts sample data (if not
// already present). Runs automatically on every server startup, so a fresh
// VibeNest deploy just works with no manual step. Also runnable directly:
//   npm run migrate

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("./db");

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin account setup. " +
      "Nobody will be able to log in until these are set and the app restarts."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email, passwordHash, process.env.ADMIN_NAME || "Admin"]
  );
}

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);

  const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
  await pool.query(seed);

  await ensureAdminUser();

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
