// routes/drivers.js
const express = require("express");
const router = express.Router();
const pool = require("../db/db");

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM drivers ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM drivers WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Driver not found" });
    const trips = (await pool.query(
      "SELECT * FROM trips WHERE driver_id = $1 ORDER BY start_time DESC",
      [req.params.id]
    )).rows;
    res.json({ ...rows[0], trips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { full_name, license_number, phone, email, status } = req.body;
  if (!full_name || !license_number) {
    return res.status(400).json({ error: "full_name and license_number are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO drivers (full_name, license_number, phone, email, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [full_name, license_number, phone || null, email || null, status || "available"]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A driver with that license number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const existing = await pool.query("SELECT * FROM drivers WHERE id = $1", [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Driver not found" });
    const e = existing.rows[0];
    const b = req.body;

    const { rows } = await pool.query(
      `UPDATE drivers SET full_name=$1, license_number=$2, phone=$3, email=$4, status=$5
       WHERE id=$6 RETURNING *`,
      [
        b.full_name ?? e.full_name,
        b.license_number ?? e.license_number,
        b.phone ?? e.phone,
        b.email ?? e.email,
        b.status ?? e.status,
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
    const { rows } = await pool.query("DELETE FROM drivers WHERE id = $1 RETURNING id", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Driver not found" });
    res.json({ message: "Driver deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
