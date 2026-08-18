// public/js/drivers.js - runs only on drivers.html

async function loadDrivers() {
  const drivers = await api("/drivers");
  const tbody = document.querySelector("#drivers-table tbody");
  tbody.innerHTML = drivers.map(d => `
    <tr>
      <td>${d.full_name}</td>
      <td>${d.license_number}</td>
      <td>${d.phone ?? "-"}</td>
      <td>${badge(d.status)}</td>
      <td><button class="icon-btn" onclick="deleteDriver(${d.id})">Delete</button></td>
    </tr>
  `).join("");
}

async function deleteDriver(id) {
  if (!confirm("Delete this driver?")) return;
  await api(`/drivers/${id}`, { method: "DELETE" });
  loadDrivers();
}

document.getElementById("driver-form").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await api("/drivers", { method: "POST", body: JSON.stringify(Object.fromEntries(fd)) });
  e.target.reset();
  loadDrivers();
});

loadDrivers();
