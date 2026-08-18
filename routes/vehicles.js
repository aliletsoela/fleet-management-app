// routes/vehicles.js
const express = require("express");
const router = express.Router();
const pool = require("../db/db");

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM vehicles ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM vehicles WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Vehicle not found" });

    const maintenance = (await pool.query(
      "SELECT * FROM maintenance WHERE vehicle_id = $1 ORDER BY service_date DESC",
      [req.params.id]
    )).rows;
    const trips = (await pool.query(
      "SELECT * FROM trips WHERE vehicle_id = $1 ORDER BY start_time DESC",
      [req.params.id]
    )).rows;

    res.json({ ...rows[0], maintenance, trips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { plate_number, make, model, year, fuel_type, status, mileage } = req.body;
  if (!plate_number || !make || !model) {
    return res.status(400).json({ error: "plate_number, make, and model are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO vehicles (plate_number, make, model, year, fuel_type, status, mileage)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [plate_number, make, model, year || null, fuel_type || "petrol", status || "active", mileage || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A vehicle with that plate number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const existing = await pool.query("SELECT * FROM vehicles WHERE id = $1", [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Vehicle not found" });
    const e = existing.rows[0];
    const b = req.body;

    const { rows } = await pool.query(
      `UPDATE vehicles SET plate_number=$1, make=$2, model=$3, year=$4, fuel_type=$5, status=$6, mileage=$7
       WHERE id=$8 RETURNING *`,
      [
        b.plate_number ?? e.plate_number,
        b.make ?? e.make,
        b.model ?? e.model,
        b.year ?? e.year,
        b.fuel_type ?? e.fuel_type,
        b.status ?? e.status,
        b.mileage ?? e.mileage,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("DELETE FROM vehicles WHERE id = $1 RETURNING id", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Vehicle not found" });
    res.json({ message: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
