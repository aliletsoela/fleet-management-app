// public/js/maintenance.js - runs only on maintenance.html

async function loadMaintenance() {
  const records = await api("/maintenance");
  const tbody = document.querySelector("#maintenance-table tbody");
  tbody.innerHTML = records.map(m => `
    <tr>
      <td>${m.plate_number}</td>
      <td>${m.service_type}</td>
      <td>${m.cost ? "$" + m.cost : "-"}</td>
      <td>${m.service_date}</td>
      <td>${badge(m.status)}</td>
      <td><button class="icon-btn" onclick="deleteMaintenance(${m.id})">Delete</button></td>
    </tr>
  `).join("");
}

async function deleteMaintenance(id) {
  if (!confirm("Delete this record?")) return;
  await api(`/maintenance/${id}`, { method: "DELETE" });
  loadMaintenance();
}

document.getElementById("maintenance-form").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await api("/maintenance", { method: "POST", body: JSON.stringify(Object.fromEntries(fd)) });
  e.target.reset();
  loadMaintenance();
});

(async function init() {
  await populateVehicleSelects();
  await loadMaintenance();
})();
