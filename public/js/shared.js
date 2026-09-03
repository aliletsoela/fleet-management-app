// public/js/shared.js
// Loaded on every page. Provides the API helper and small UI utilities
// that each page-specific script (dashboard.js, vehicles.js, etc.) uses.

const API = "/api";

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 401 && !path.startsWith("/auth/")) {
    window.location.href = "/login.html";
    return new Promise(() => {});
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/login.html";
  }
}

function badge(status) {
  return `<span class="badge ${status}">${status.replace(/_/g, " ")}</span>`;
}

// Fills any <select name="vehicle_id"> / <select name="driver_id"> on the
// current page with live options. Call this on pages with trip/maintenance forms.
async function populateVehicleSelects() {
  const selects = document.querySelectorAll('select[name="vehicle_id"]');
  if (!selects.length) return;
  const vehicles = await api("/vehicles");
  selects.forEach(sel => {
    sel.innerHTML = vehicles.map(v => `<option value="${v.id}">${v.plate_number} - ${v.make} ${v.model}</option>`).join("");
  });
}

async function populateDriverSelects() {
  const selects = document.querySelectorAll('select[name="driver_id"]');
  if (!selects.length) return;
  const drivers = await api("/drivers");
  selects.forEach(sel => {
    sel.innerHTML = drivers.map(d => `<option value="${d.id}">${d.full_name}</option>`).join("");
  });
}
