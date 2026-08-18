# Fleet Manager

**My first full-stack web app** 🚛 — a real fleet management system, not a
tutorial project. It tracks vehicles, drivers, trips, and maintenance for a
small fleet, backed by a live database, with a dashboard that updates itself
in real time as data changes.

## About this project

I built this to learn how a complete web app actually fits together: a
frontend people can click through, a backend that enforces rules (a vehicle
automatically flips to "in maintenance" when a service starts and back to
"active" when it's done, and deleting a vehicle or driver cleanly removes
its related trips and maintenance records via database foreign keys), and a
real database that holds up over time instead of losing data on refresh.

**What it does:**
- Add, view, and remove **vehicles**, tracking status (active / in maintenance / out of service), fuel type, and mileage
- Add, view, and remove **drivers**, tracking license number and availability
- Log **trips**, linking a specific vehicle to a specific driver with route and timing
- Log **maintenance records**, with cost and next-due-date tracking
- A **dashboard** that shows live fleet totals and upcoming maintenance, and auto-refreshes every 15 seconds — so it stays current even left open in a tab while changes happen elsewhere

**How it's built:**
- Frontend: plain HTML/CSS/JavaScript — no framework, so every part of it is code I wrote and understand
- Backend: a standard Node.js/Express server with a REST API
- Database: Postgres, schema-managed through versioned SQL files, migrated automatically on every server startup
- Hosting/deploy: [VibeNest](https://vibenest.net), auto-deploying from this GitHub repo

It's a small system, but every piece — forms, API, database, live updates — is
fully working end to end, which was the actual goal.

## Project structure

```
fleet-management-app/
├── server.js               # entry point - starts Express, runs DB migrations, serves everything
├── package.json
├── .env.example             # copy to .env for local development
├── db/
│   ├── db.js                 # Postgres connection pool
│   ├── schema.sql             # table definitions (idempotent)
│   ├── seed.sql                # sample starter data (idempotent)
│   └── migrate.js               # runs schema.sql + seed.sql, called on every startup
├── routes/                   # Express routers - one file per resource
│   ├── vehicles.js
│   ├── drivers.js
│   ├── trips.js
│   ├── maintenance.js
│   └── dashboard.js
└── public/                   # static frontend - one HTML file per section
    ├── index.html               # Dashboard  (/)
    ├── vehicles.html             # Vehicles   (/vehicles.html)
    ├── drivers.html                # Drivers    (/drivers.html)
    ├── trips.html                   # Trips      (/trips.html)
    ├── maintenance.html               # Maintenance (/maintenance.html)
    ├── style.css
    └── js/
        ├── shared.js                    # api() helper + badge() + select-populating helpers, loaded on every page
        ├── dashboard.js
        ├── vehicles.js
        ├── drivers.js
        ├── trips.js
        └── maintenance.js
```

Each page is a real, separate URL, so you can bookmark or share a direct link
to any section (e.g. `https://yourapp.vibenest.app/vehicles.html`).

---

## Deploying on VibeNest

### 1. Push this code to GitHub
If it isn't already, get this folder into a GitHub repository (see the
"uploading an existing file" flow on a new empty repo if you'd rather not use
the command line).

### 2. Import it into VibeNest
- Go to vibenest.net and sign in
- Point it at your GitHub repository
- VibeNest analyzes the repo, detects it's a Node app (via `package.json`'s
  `start` script), and prepares to build it

### 3. Attach a managed Postgres database
- In your VibeNest project, add a managed Postgres database
- VibeNest automatically injects a `DATABASE_URL` environment variable into
  your app once it's attached — you don't need to copy/paste a connection
  string anywhere

### 4. Deploy
- Trigger the deploy. VibeNest builds the container, runs `npm start`, which:
  1. Runs `db/migrate.js` automatically (creates tables if they don't exist,
     inserts sample data if it's not already there)
  2. Starts the Express server, listening on the `PORT` VibeNest provides,
     bound to `0.0.0.0` so it's reachable publicly
- You'll get a live URL on a VibeNest subdomain with HTTPS already set up

### 5. Confirm it works
Open the live URL — you should see the dashboard with sample data (3
vehicles, 2 drivers). Try adding a vehicle on the Vehicles page; it should
save and appear in the table immediately.

---

## Local development

```bash
npm install
cp .env.example .env
# edit .env with a real Postgres connection string (a free local Postgres,
# or a temporary database from any provider works fine for testing)
npm start
```

Visit `http://localhost:3000`. The server auto-migrates the database on
startup, so tables and sample data appear automatically the first time it runs.

---

## Making daily updates to the data

No code changes or redeploys needed for this — the app talks directly to the
live database.

- **Use the app itself** (recommended): each page's form adds new records;
  each row has a Delete button. This is the normal way to log a new trip, add
  a vehicle, or record a service.
- **Direct database access**: if VibeNest exposes a database browser/SQL
  console in its dashboard, you can use that for bulk edits or quick fixes.
- **Bulk/scripted updates**: connect any Postgres client to the same
  `DATABASE_URL` VibeNest is using for the app, and run SQL directly.

## Making updates to the app itself (code changes)

This is different from updating data — this is for changing features, forms, or logic.

1. Edit files locally (e.g. add a new field to `public/vehicles.html` + the
   matching route in `routes/vehicles.js`).
2. If you're changing the database schema, edit `db/schema.sql` — it uses
   `CREATE TABLE IF NOT EXISTS` and similar guards, so it's safe to add new
   `ALTER TABLE` statements or new tables without breaking existing data. For
   anything destructive (renaming/dropping a column that already has data),
   write it carefully and test locally first.
3. Test locally with `npm start`.
4. Commit and push to GitHub. If you've connected VibeNest to auto-deploy on
   push, it redeploys automatically; otherwise trigger a deploy from the
   VibeNest dashboard.

## Environment variables

- `DATABASE_URL` — Postgres connection string. Injected automatically by
  VibeNest once a database is attached; set manually in `.env` for local dev.
- `PORT` — which port the server listens on. VibeNest sets this
  automatically; defaults to `3000` locally.

## Troubleshooting

- **"relation does not exist" errors**: the migration hasn't run successfully
  yet. Check your deploy logs for a "Startup migration failed" message — it's
  usually a `DATABASE_URL` that isn't set or isn't reachable yet.
- **App builds but isn't publicly reachable**: make sure `server.js` binds to
  `0.0.0.0` (it does, by default, in this project) rather than `localhost` —
  binding to `localhost` only accepts traffic from inside the container.
- **CORS or 404 on `/api/...` calls**: check that the frontend's `API`
  constant in `public/js/shared.js` is `/api` (relative), and that
  `server.js` mounts each router under `/api/<resource>`.
