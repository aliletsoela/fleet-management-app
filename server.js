require("dotenv").config();

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const cors = require("cors");
const path = require("path");
const pool = require("./db/db");
const migrate = require("./db/migrate");

const authRouter = require("./routes/auth");
const vehiclesRouter = require("./routes/vehicles");
const driversRouter = require("./routes/drivers");
const tripsRouter = require("./routes/trips");
const maintenanceRouter = require("./routes/maintenance");
const dashboardRouter = require("./routes/dashboard");
const kpisRouter = require("./routes/kpis");

const app = express();

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

app.use(
  session({
    store: new pgSession({ pool, tableName: "session", createTableIfMissing: false }),
    secret: process.env.SESSION_SECRET || "dev-only-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

if (!process.env.SESSION_SECRET) {
  console.warn(
    "WARNING: SESSION_SECRET is not set - using an insecure default. " +
    "Set SESSION_SECRET to a long random string in production."
  );
}

app.use("/api/auth", authRouter);

const PUBLIC_PATHS = new Set([
  "/login.html",
  "/favicon.svg",
  "/style.css",
  "/js/shared.js",
  "/js/login.js",
  "/health",
]);

function requireAuth(req, res, next) {
  if (PUBLIC_PATHS.has(req.path)) return next();
  if (req.session && req.session.userId) return next();

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.redirect("/login.html");
}

app.use(requireAuth);

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/vehicles", vehiclesRouter);
app.use("/api/drivers", driversRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/kpis", kpisRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Fleet Manager listening on port ${PORT}`);
  runMigrationInBackground();
});

async function runMigrationInBackground() {
  try {
    await migrate();
    console.log("Database migration completed successfully.");
  } catch (err) {
    console.error("Startup migration failed:", err.message);
  }
}
