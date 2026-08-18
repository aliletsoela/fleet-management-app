// public/js/kpis.js - runs only on kpis.html
// Renders donut + bar charts using plain SVG/CSS - no charting library needed.

const REFRESH_INTERVAL_MS = 30000; // KPIs change less often than the dashboard totals

const STATUS_COLORS = {
  active: "#2dd4bf",
  in_maintenance: "#ffb020",
  out_of_service: "#fb7185",
};

  function money(n) {
  return "R" + Number(n).toLocaleString("en-ZA", { maximumFractionDigits: 0 });
}

// Draws a donut chart from [{status, count}] into the given <svg>, and
// fills a legend list into the given container.
function renderDonut(svgEl, legendEl, breakdown, total) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  svgEl.innerHTML = "";

  breakdown.forEach(row => {
    const count = Number(row.count);
    const fraction = total > 0 ? count / total : 0;
    const dash = fraction * circumference;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "60");
    circle.setAttribute("cy", "60");
    circle.setAttribute("r", radius);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", STATUS_COLORS[row.status] || "#8a95ab");
    circle.setAttribute("stroke-width", "16");
    circle.setAttribute("stroke-dasharray", `${dash} ${circumference - dash}`);
    circle.setAttribute("stroke-dashoffset", -offset);
    circle.setAttribute("transform", "rotate(-90 60 60)");
    svgEl.appendChild(circle);
    offset += dash;
  });

  legendEl.innerHTML = breakdown.map(row => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${STATUS_COLORS[row.status] || "#8a95ab"}"></span>
      ${row.status.replace(/_/g, " ")} — ${row.count}
    </div>
  `).join("");
}

function renderBarChart(container, items, valueKey, labelKey, formatFn = v => v) {
  const max = Math.max(...items.map(i => Number(i[valueKey])), 1);
  container.innerHTML = items.map(item => {
    const value = Number(item[valueKey]);
    const pct = Math.max((value / max) * 100, 2);
    return `
      <div class="bar-row">
        <div class="bar-label">${item[labelKey]}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-value">${formatFn(value)}</div>
      </div>
    `;
  }).join("") || `<p class="chart-caption">No data yet.</p>`;
}

async function loadKpis() {
  const indicator = document.getElementById("live-indicator");
  try {
    const data = await api("/kpis");

    // ---- Utilization ----
    document.getElementById("utilization-rate").textContent = `${data.utilization.utilizationRate}%`;
    renderDonut(
      document.getElementById("utilization-donut"),
      document.getElementById("utilization-legend"),
      data.utilization.statusBreakdown,
      data.utilization.totalVehicles
    );

    // ---- Downtime ----
    document.getElementById("downtime-cards").innerHTML = `
      <div class="card"><div class="label">In Maintenance</div><div class="value">${data.downtime.inMaintenanceCount}</div></div>
      <div class="card"><div class="label">Out of Service</div><div class="value">${data.downtime.outOfServiceCount}</div></div>
      <div class="card"><div class="label">Open Service Records</div><div class="value">${data.downtime.openMaintenanceRecords}</div></div>
      <div class="card"><div class="label">Total Maintenance Cost</div><div class="value">${money(data.downtime.totalMaintenanceCost)}</div></div>
    `;
    renderBarChart(
      document.getElementById("downtime-chart"),
      data.downtime.costByMonth,
      "cost", "month", money
    );

    // ---- Delivery performance ----
    document.getElementById("delivery-cards").innerHTML = `
      <div class="card"><div class="label">Completion Rate</div><div class="value">${data.delivery.completionRate}%</div></div>
      <div class="card"><div class="label">Completed Trips</div><div class="value">${data.delivery.completedTrips}</div></div>
      <div class="card"><div class="label">Avg Distance</div><div class="value">${data.delivery.avgDistanceKm} km</div></div>
      <div class="card"><div class="label">Total Distance</div><div class="value">${data.delivery.totalDistanceKm} km</div></div>
    `;
    renderBarChart(
      document.getElementById("driver-chart"),
      data.delivery.tripsPerDriver,
      "tripCount", "driverName"
    );

    document.getElementById("last-updated").textContent = `Last updated ${new Date().toLocaleTimeString()}`;
    if (indicator) indicator.classList.remove("stale");
  } catch (err) {
    if (indicator) indicator.classList.add("stale");
    console.error("KPI refresh failed:", err.message);
  }
}

loadKpis();
setInterval(loadKpis, REFRESH_INTERVAL_MS);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") loadKpis();
});
