// routes/maintenance.js
const express = require("express");
const router = express.Router();
const pool = require("../db/db");

router.get("/", async (req, res) => {
  try {
    const vehicleId = req.query.vehicle_id;
    const { rows } = vehicleId
      ? await pool.query(
          `SELECT m.*, v.plate_number, v.make, v.model
           FROM maintenance m JOIN vehicles v ON v.id = m.vehicle_id
           WHERE m.vehicle_id = $1 ORDER BY m.service_date DESC`,
          [vehicleId]
        )
      : await pool.query(
          `SELECT m.*, v.plate_number, v.make, v.model
           FROM maintenance m JOIN vehicles v ON v.id = m.vehicle_id
           ORDER BY m.service_date DESC`
        );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { vehicle_id, service_type, description, cost, service_date, next_due_date, status } = req.body;
  if (!vehicle_id || !service_type || !service_date) {
    return res.status(400).json({ error: "vehicle_id, service_type, and service_date are required" });
  }
  try {
    const vehicleExists = await pool.query("SELECT id FROM vehicles WHERE id = $1", [vehicle_id]);
    if (!vehicleExists.rows.length) return res.status(404).json({ error: "Vehicle not found" });

    const { rows } = await pool.query(
      `INSERT INTO maintenance (vehicle_id, service_type, description, cost, service_date, next_due_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [vehicle_id, service_type, description || null, cost || 0, service_date, next_due_date || null, status || "completed"]
    );

    if ((status || "completed") !== "completed") {
      await pool.query("UPDATE vehicles SET status = 'in_maintenance' WHERE id = $1", [vehicle_id]);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const existing = await pool.query("SELECT * FROM maintenance WHERE id = $1", [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Maintenance record not found" });
    const e = existing.rows[0];
    const b = req.body;

    const { rows } = await pool.query(
      `UPDATE maintenance SET service_type=$1, description=$2, cost=$3, service_date=$4,
        next_due_date=$5, status=$6 WHERE id=$7 RETURNING *`,
      [
        b.service_type ?? e.service_type,
        b.description ?? e.description,
        b.cost ?? e.cost,
        b.service_date ?? e.service_date,
        b.next_due_date ?? e.next_due_date,
        b.status ?? e.status,
        req.params.id,
      ]
    );

    if (b.status === "completed") {
      await pool.query("UPDATE vehicles SET status = 'active' WHERE id = $1", [e.vehicle_id]);
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("DELETE FROM maintenance WHERE id = $1 RETURNING id", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Maintenance record not found" });
    res.json({ message: "Maintenance record deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
