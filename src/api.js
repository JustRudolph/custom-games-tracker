async function request(path, options) {
  const response = await fetch("/api" + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Request failed.");
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  getPlayers: () => request("/players"),
  createPlayer: (player) => request("/players", { method: "POST", body: JSON.stringify(player) }),
  updatePlayer: (player) => request("/players/" + player.id, { method: "PUT", body: JSON.stringify(player) }),
  deletePlayer: (id) => request("/players/" + id, { method: "DELETE" }),
  getMatches: () => request("/matches"),
  createMatch: (match) => request("/matches", { method: "POST", body: JSON.stringify(match) }),
  deleteMatch: (id) => request("/matches/" + id, { method: "DELETE" }),
  deleteMatches: (ids) => Promise.all(ids.map((id) => request("/matches/" + id, { method: "DELETE" }))),
};
