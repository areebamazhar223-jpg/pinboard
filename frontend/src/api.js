const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Can't reach the server. Check that the Python backend is running.");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}

export const api = {
  categories: () => request("/categories"),
  list: ({ q = "", category = "All", saved = false, page = 1 }) => {
    const params = new URLSearchParams({ q, category, page });
    if (saved) params.set("saved", "1");
    return request(`/pins?${params}`);
  },
  create: (pin) => request("/pins", { method: "POST", body: JSON.stringify(pin) }),
  toggleLike: (id) => request(`/pins/${id}/like`, { method: "POST" }),
  toggleSave: (id) => request(`/pins/${id}/save`, { method: "POST" }),
  remove: (id) => request(`/pins/${id}`, { method: "DELETE" }),
};