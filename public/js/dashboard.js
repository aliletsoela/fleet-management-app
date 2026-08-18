// public/js/dashboard.js - runs only on index.html
// Fetches dashboard stats on load, then re-fetches automatically every
// REFRESH_INTERVAL_MS so the page stays current even if left open while
// data changes elsewhere (another tab, another person, etc).

const REFRESH_INTERVAL_MS = 15000; // 15 seconds

async function loadDashboard() {
  const indicator = document.getElementById("live-indicator");
  try {
    const data = await api("/dashboard");

    const cards = document.getElementById("stat-cards");
    cards.innerHTML = `
      <div class="card"><div class="label">Total Vehicles</div><div class="value">${data.vehicleCounts.total}</div></div>
      <div class="card"><div class="label">Active</div><div class="value">${data.vehicleCounts.active}</div></div>
      <div class="card"><div class="label">In Maintenance</div><div class="value">${data.vehicleCounts.in_maintenance}</div></div>
      <div class="card"><div class="label">Drivers Available</div><div class="value">${data.driverCounts.available}/${data.driverCounts.total}</div></div>
      <div class="card"><div class="label">Trips In Progress</div><div class="value">${data.tripCounts.active_trips}</div></div>
    `;

    const tbody = document.querySelector("#upcoming-maintenance-table tbody");
    tbody.innerHTML = data.upcomingMaintenance.map(m => `
      <tr><td>${m.plate_number}</td><td>${m.service_type}</td><td>${m.next_due_date ?? "-"}</td><td>${badge(m.status)}</td></tr>
    `).join("") || `<tr><td colspan="4">Nothing scheduled 🎉</td></tr>`;

    document.getElementById("last-updated").textContent =
      `Last updated ${new Date().toLocaleTimeString()}`;
    if (indicator) indicator.classList.remove("stale");
  } catch (err) {
    // Don't nuke the dashboard on a transient network error - just flag it
    if (indicator) indicator.classList.add("stale");
    console.error("Dashboard refresh failed:", err.message);
  }
}

loadDashboard();
setInterval(loadDashboard, REFRESH_INTERVAL_MS);

// Also refresh immediately whenever the tab regains focus, so switching
// back from another app/tab doesn't leave you looking at stale numbers.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") loadDashboard();
});
