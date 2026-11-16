// Vite uses import.meta.env to read environment variables
const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchAccounts(params) {
  const url = new URL(`${API_BASE}/accounts`);
  
  // Attach filters like page or search directly to the URL
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });
  
  const res = await fetch(url);
  return res.json();
}

export async function fetchSummary(dateFrom, dateTo) {
  const url = new URL(`${API_BASE}/accounts/summary`);
  if (dateFrom) url.searchParams.append("date_from", dateFrom);
  if (dateTo) url.searchParams.append("date_to", dateTo);
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Chart API failed");
  return res.json();
}

export async function fetchSettings(id) {
  const res = await fetch(`${API_BASE}/accounts/${id}/settings`);
  if (!res.ok) return {};
  return res.json();
}

export async function saveSettingsStep(id, step, data) {
  const res = await fetch(`${API_BASE}/accounts/${id}/settings/step/${step}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw errorData.detail; // Returns the exact step that failed
  }
  return res.json();
}

export async function submitSettings(id) {
  const res = await fetch(`${API_BASE}/accounts/${id}/settings/submit`, { method: "POST" });
  if (!res.ok) {
    const errorData = await res.json();
    throw errorData.detail;
  }
  return true;
}