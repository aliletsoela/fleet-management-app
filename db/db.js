// db/db.js - Postgres connection pool.
// VibeNest's managed Postgres injects DATABASE_URL automatically when you
// attach a database to your app. Locally, set DATABASE_URL in a .env file
// (see .env.example).

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.warn(
    "WARNING: DATABASE_URL is not set. Set it in your environment " +
    "(VibeNest injects this automatically once a database is attached; " +
    "locally, copy .env.example to .env and fill it in)."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Most managed Postgres providers (including VibeNest) require SSL but use
  // certificates that Node won't automatically trust - this is the standard,
  // safe-enough default for that. Skip SSL for a plain local Postgres.
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  // Without these, `pg`'s default is to wait indefinitely if the database
  // host is unreachable (as opposed to actively refusing the connection) -
  // that hang is what causes platforms like Cloud Run to kill the container
  // for never opening its port in time. Fail fast instead.
  connectionTimeoutMillis: 8000,
  statement_timeout: 10000,
});

pool.on("error", err => {
  // Handles errors on idle clients in the pool (e.g. a dropped connection)
  // so they don't crash the whole process with an uncaught exception.
  console.error("Unexpected Postgres pool error:", err.message);
});

module.exports = pool;
