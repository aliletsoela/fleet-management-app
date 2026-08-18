// routes/trips.js
const express = require("express");
const router = express.Router();
const pool = require("../db/db");

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, v.plate_number, d.full_name AS driver_name
      FROM trips t
      JOIN vehicles v ON v.id = t.vehicle_id
      JOIN drivers d ON d.id = t.driver_id
      ORDER BY t.start_time DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { vehicle_id, driver_id, start_location, end_location, start_time, end_time, distance_km, purpose, status } = req.body;
  if (!vehicle_id || !driver_id || !start_location || !end_location || !start_time) {
    return res.status(400).json({ error: "vehicle_id, driver_id, start_location, end_location, and start_time are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO trips (vehicle_id, driver_id, start_location, end_location, start_time, end_time, distance_km, purpose, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [vehicle_id, driver_id, start_location, end_location, start_time, end_time || null, distance_km || 0, purpose || null, status || "scheduled"]
    );

    if ((status || "scheduled") === "in_progress") {
      await pool.query("UPDATE drivers SET status = 'on_trip' WHERE id = $1", [driver_id]);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const existing = await pool.query("SELECT * FROM trips WHERE id = $1", [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Trip not found" });
    const e = existing.rows[0];
    const b = req.body;

    const { rows } = await pool.query(
      `UPDATE trips SET start_location=$1, end_location=$2, start_time=$3, end_time=$4,
        distance_km=$5, purpose=$6, status=$7 WHERE id=$8 RETURNING *`,
      [
        b.start_location ?? e.start_location,
        b.end_location ?? e.end_location,
        b.start_time ?? e.start_time,
        b.end_time ?? e.end_time,
        b.distance_km ?? e.distance_km,
        b.purpose ?? e.purpose,
        b.status ?? e.status,
        req.params.id,
      ]
    );

    if (b.status === "completed") {
      await pool.query("UPDATE drivers SET status = 'available' WHERE id = $1", [e.driver_id]);
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("DELETE FROM trips WHERE id = $1 RETURNING id", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Trip not found" });
    res.json({ message: "Trip deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
