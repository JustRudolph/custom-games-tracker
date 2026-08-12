const apiBase = String(import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, options) {
  const response = await fetch(apiBase + path, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Request failed.");
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getCurrentAdmin: () => request("/auth/me"),
  updateProfile: (profile) => request("/auth/profile", { method: "PATCH", body: JSON.stringify(profile) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getPlayers: () => request("/players"),
  createPlayer: (player) => request("/players", { method: "POST", body: JSON.stringify(player) }),
  updatePlayer: (player) => request("/players/" + player.id, { method: "PUT", body: JSON.stringify(player) }),
  deletePlayer: (id) => request("/players/" + id, { method: "DELETE" }),
  getMatches: () => request("/matches"),
  createMatch: (match) => request("/matches", { method: "POST", body: JSON.stringify(match) }),
  deleteMatch: (id) => request("/matches/" + id, { method: "DELETE" }),
};
