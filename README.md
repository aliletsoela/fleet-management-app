# Fleet Manager

**My first full-stack web app** 🚛 — a real fleet management system, not a
tutorial project. It tracks vehicles, drivers, trips, and maintenance for a
small fleet, backed by a live database, with a dashboard that updates itself
in real time as data changes and also has visualizations of KPIs like utlization, downtime, and delivery performance.

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
-  **Delivery performance** — trip completion rate, average/total distance, and trips per driver

**How KPIs are calculated:**
- **Utilization** = active vehicles ÷ total vehicles, based on current status
- **Downtime** = count of open maintenance records, out-of-service vehicles, and total maintenance cost (in Rand), trended by month
- **Delivery performance** = completed trips ÷ total trips, plus average and total distance from completed trips only

All figures are computed live from the database on each request — nothing is cached or precalculated, so the KPIs page always reflects the current state of your data.

**How it's built:**
- Frontend: plain HTML/CSS/JavaScript — no framework, so every part of it is code I wrote and understand
- Backend: a standard Node.js/Express server with a REST API
- Database: Postgres, schema-managed through versioned SQL files, migrated automatically on every server startup
- Hosting/deploy: [Render](https://render.com), auto-deploying from this GitHub repo

It's a small system, but every piece — forms, API, database, live updates — is
fully working end-to-end, which was the actual goal.

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
---
