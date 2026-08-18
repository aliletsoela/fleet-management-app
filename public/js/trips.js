// public/js/trips.js - runs only on trips.html

async function loadTrips() {
  const trips = await api("/trips");
  const tbody = document.querySelector("#trips-table tbody");
  tbody.innerHTML = trips.map(t => `
    <tr>
      <td>${t.plate_number}</td>
      <td>${t.driver_name}</td>
      <td>${t.start_location} → ${t.end_location}</td>
      <td>${new Date(t.start_time).toLocaleString()}</td>
      <td>${badge(t.status)}</td>
      <td><button class="icon-btn" onclick="deleteTrip(${t.id})">Delete</button></td>
    </tr>
  `).join("");
}

async function deleteTrip(id) {
  if (!confirm("Delete this trip?")) return;
  await api(`/trips/${id}`, { method: "DELETE" });
  loadTrips();
}

document.getElementById("trip-form").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await api("/trips", { method: "POST", body: JSON.stringify(Object.fromEntries(fd)) });
  e.target.reset();
  loadTrips();
  populateVehicleSelects();
  populateDriverSelects();
});

(async function init() {
  await populateVehicleSelects();
  await populateDriverSelects();
  await loadTrips();
})();
