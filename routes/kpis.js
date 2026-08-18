// routes/kpis.js - aggregated fleet performance metrics
const express = require("express");
const router = express.Router();
const pool = require("../db/db");

router.get("/", async (req, res) => {
  try {
    // ---------- Utilization: current vehicle status breakdown ----------
    const statusBreakdown = (await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM vehicles
      GROUP BY status
    `)).rows;

    const totalVehicles = statusBreakdown.reduce((sum, r) => sum + Number(r.count), 0);
    const activeCount = Number(statusBreakdown.find(r => r.status === "active")?.count || 0);
    const utilizationRate = totalVehicles > 0 ? Math.round((activeCount / totalVehicles) * 1000) / 10 : 0;

    // ---------- Downtime: maintenance load and cost ----------
    const downtimeCounts = (await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('scheduled', 'in_progress')) AS open_records,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_records,
        COALESCE(SUM(cost), 0) AS total_cost
      FROM maintenance
    `)).rows[0];

    const costByMonth = (await pool.query(`
      SELECT to_char(date_trunc('month', service_date), 'YYYY-MM') AS month,
             COALESCE(SUM(cost), 0) AS cost,
             COUNT(*) AS events
      FROM maintenance
      WHERE service_date >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY 1
      ORDER BY 1
    `)).rows;

    const outOfServiceCount = Number(statusBreakdown.find(r => r.status === "out_of_service")?.count || 0);
    const inMaintenanceCount = Number(statusBreakdown.find(r => r.status === "in_maintenance")?.count || 0);

    // ---------- Delivery performance: trip outcomes ----------
    const tripCounts = (await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE status IN ('scheduled', 'in_progress')) AS pending,
        COALESCE(AVG(distance_km) FILTER (WHERE status = 'completed'), 0) AS avg_distance_km,
        COALESCE(SUM(distance_km) FILTER (WHERE status = 'completed'), 0) AS total_distance_km
      FROM trips
    `)).rows[0];

    const totalTrips = Number(tripCounts.total);
    const completionRate = totalTrips > 0
      ? Math.round((Number(tripCounts.completed) / totalTrips) * 1000) / 10
      : 0;

    const tripsPerDriver = (await pool.query(`
      SELECT d.full_name, COUNT(t.id) AS trip_count,
             COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_count
      FROM drivers d
      LEFT JOIN trips t ON t.driver_id = d.id
      GROUP BY d.full_name
      ORDER BY trip_count DESC
      LIMIT 10
    `)).rows;

    res.json({
      utilization: {
        totalVehicles,
        activeCount,
        inMaintenanceCount,
        outOfServiceCount,
        utilizationRate,
        statusBreakdown,
      },
      downtime: {
        openMaintenanceRecords: Number(downtimeCounts.open_records),
        completedMaintenanceRecords: Number(downtimeCounts.completed_records),
        totalMaintenanceCost: Number(downtimeCounts.total_cost),
        outOfServiceCount,
        inMaintenanceCount,
        costByMonth: costByMonth.map(r => ({
          month: r.month,
          cost: Number(r.cost),
          events: Number(r.events),
        })),
      },
      delivery: {
        totalTrips,
        completedTrips: Number(tripCounts.completed),
        cancelledTrips: Number(tripCounts.cancelled),
        pendingTrips: Number(tripCounts.pending),
        completionRate,
        avgDistanceKm: Math.round(Number(tripCounts.avg_distance_km) * 10) / 10,
        totalDistanceKm: Math.round(Number(tripCounts.total_distance_km) * 10) / 10,
        tripsPerDriver: tripsPerDriver.map(r => ({
          driverName: r.full_name,
          tripCount: Number(r.trip_count),
          completedCount: Number(r.completed_count),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
