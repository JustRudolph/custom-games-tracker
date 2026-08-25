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
  getAccounts: () => request("/accounts"),
  getFunFacts: () => request("/fun-facts"),
  createFunFact: (fact) => request("/fun-facts", { method: "POST", body: JSON.stringify(fact) }),
  updateFunFact: (fact) => request("/fun-facts/" + fact.id, { method: "PATCH", body: JSON.stringify(fact) }),
  deleteFunFact: (id) => request("/fun-facts/" + id, { method: "DELETE" }),
  getShameEntries: () => request("/board-of-shame"),
  createShameEntry: (entry) => request("/board-of-shame", { method: "POST", body: JSON.stringify(entry) }),
  deleteShameEntry: (id) => request("/board-of-shame/" + id, { method: "DELETE" }),
  createAccount: (account) => request("/accounts", { method: "POST", body: JSON.stringify(account) }),
  updateAccount: (account) => request("/accounts/" + account.id, { method: "PATCH", body: JSON.stringify(account) }),
  deleteAccount: (id) => request("/accounts/" + id, { method: "DELETE" }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getPlayers: () => request("/players"),
  createPlayer: (player) => request("/players", { method: "POST", body: JSON.stringify(player) }),
  updatePlayer: (player) => request("/players/" + player.id, { method: "PUT", body: JSON.stringify(player) }),
  deletePlayer: (id) => request("/players/" + id, { method: "DELETE" }),
  getMatches: () => request("/matches"),
  submitMatch: (match) => request("/match-submissions", { method: "POST", body: JSON.stringify(match) }),
  createMatch: (match) => request("/matches", { method: "POST", body: JSON.stringify(match) }),
  createMatchDraft: (match) => request("/matches?mode=draft", { method: "POST", body: JSON.stringify(match) }),
  updateMatch: (match) => request("/matches/" + match.id, { method: "PUT", body: JSON.stringify(match) }),
  updateMatchDraft: (match) => request("/matches/" + match.id + "?mode=draft", { method: "PUT", body: JSON.stringify(match) }),
  approveMatch: (id) => request("/matches/" + id + "/approve", { method: "POST" }),
  deleteMatch: (id) => request("/matches/" + id, { method: "DELETE" }),
};
