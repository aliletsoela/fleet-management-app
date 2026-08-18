// server.js - main entry point. VibeNest runs this via `npm start`.

require("dotenv").config(); // no-op in production if there's no .env file - fine

const express = require("express");
const cors = require("cors");
const path = require("path");
const migrate = require("./db/migrate");

const vehiclesRouter = require("./routes/vehicles");
const driversRouter = require("./routes/drivers");
const tripsRouter = require("./routes/trips");
const maintenanceRouter = require("./routes/maintenance");
const dashboardRouter = require("./routes/dashboard");
const kpisRouter = require("./routes/kpis");

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/drivers", driversRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/kpis", kpisRouter);

// Simple health check - useful for VibeNest's post-deploy checks
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Static frontend (index.html, vehicles.html, style.css, js/*, etc.)
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// Start listening FIRST, unconditionally. Platforms like Cloud Run, VibeNest,
// etc. health-check by waiting for something to answer on PORT within a
// timeout - if a slow or unreachable database blocks this, the container
// gets killed before it ever gets a chance to serve anything, even the
// static pages that don't need a database at all.
//
// IMPORTANT: must bind to 0.0.0.0, not localhost/127.0.0.1, or the
// container's public routing can't reach the app.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Fleet Manager listening on port ${PORT}`);
  runMigrationInBackground();
});

async function runMigrationInBackground() {
  try {
    await migrate();
    console.log("Database migration completed successfully.");
  } catch (err) {
    // Don't crash the server if migration fails or times out - log it
    // clearly. The static pages and health check still work; API routes
    // that need the database will return clear 500 errors until this is
    // fixed (check DATABASE_URL and that the database is reachable).
    console.error("Startup migration failed:", err.message);
  }
}
