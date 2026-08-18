// routes/dashboard.js - summary stats for the homepage
const express = require("express");
const router = express.Router();
const pool = require("../db/db");

router.get("/", async (req, res) => {
  try {
    const vehicleCounts = (await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'in_maintenance') AS in_maintenance,
        COUNT(*) FILTER (WHERE status = 'out_of_service') AS out_of_service
      FROM vehicles
    `)).rows[0];

    const driverCounts = (await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'available') AS available,
        COUNT(*) FILTER (WHERE status = 'on_trip') AS on_trip
      FROM drivers
    `)).rows[0];

    const tripCounts = (await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'in_progress') AS active_trips,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_trips
      FROM trips
    `)).rows[0];

    const upcomingMaintenance = (await pool.query(`
      SELECT m.*, v.plate_number FROM maintenance m
      JOIN vehicles v ON v.id = m.vehicle_id
      WHERE m.status != 'completed'
      ORDER BY m.next_due_date ASC NULLS LAST
      LIMIT 5
    `)).rows;

    res.json({ vehicleCounts, driverCounts, tripCounts, upcomingMaintenance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
