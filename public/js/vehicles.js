// public/js/vehicles.js - runs only on vehicles.html

async function loadVehicles() {
  const vehicles = await api("/vehicles");
  const tbody = document.querySelector("#vehicles-table tbody");
  tbody.innerHTML = vehicles.map(v => `
    <tr>
      <td>${v.plate_number}</td>
      <td>${v.make} ${v.model}</td>
      <td>${v.year ?? "-"}</td>
      <td>${v.fuel_type}</td>
      <td>${v.mileage}</td>
      <td>${badge(v.status)}</td>
      <td><button class="icon-btn" onclick="deleteVehicle(${v.id})">Delete</button></td>
    </tr>
  `).join("");
}

async function deleteVehicle(id) {
  if (!confirm("Delete this vehicle?")) return;
  await api(`/vehicles/${id}`, { method: "DELETE" });
  loadVehicles();
}

document.getElementById("vehicle-form").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await api("/vehicles", { method: "POST", body: JSON.stringify(Object.fromEntries(fd)) });
  e.target.reset();
  loadVehicles();
});

loadVehicles();
