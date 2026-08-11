import cors from "cors";
import "dotenv/config";
import express from "express";
import { db } from "./db.js";
import { clearSessionCookie, createSession, getSessionToken, hashToken, sessionCookie, verifyPassword } from "./auth.js";

const app = express();
const roles = new Set(["Top", "Jungle", "Middle", "Bottom", "Support"]);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());

const loginAttempts = new Map();

async function requireAuth(req, res, next) {
  const token = getSessionToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required." });
  const [rows] = await db.execute("SELECT a.id, a.username, a.display_name, a.role FROM admin_sessions s JOIN admin_accounts a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > NOW() AND a.is_active = TRUE", [hashToken(token)]);
  if (!rows.length) return res.status(401).json({ error: "Session expired." });
  req.admin = rows[0];
  next();
}

function requireWrite(req, res, next) {
  if (!new Set(["owner", "admin"]).has(req.admin.role)) return res.status(403).json({ error: "Write access required." });
  next();
}

const playerQuery = "SELECT p.id, p.summoner_name, p.is_active, p.notes, COALESCE((SELECT JSON_OBJECTAGG(prr.role, prr.rank_value) FROM player_role_ranks prr WHERE prr.player_id = p.id), JSON_OBJECT()) AS role_ranks FROM players p ORDER BY p.summoner_name";
async function getPlayers() {
  const [rows] = await db.query(playerQuery);
  return rows.map((row) => ({ id: String(row.id), name: row.summoner_name, active: Boolean(row.is_active), notes: row.notes || "", roleRanks: row.role_ranks || {} }));
}
async function saveRanks(connection, playerId, roleRanks) {
  const ranks = Object.entries(roleRanks || {}).filter(([role, rank]) => roles.has(role) && Number(rank) >= 1 && Number(rank) <= 10);
  if (ranks.length) await connection.query("INSERT INTO player_role_ranks (player_id, role, rank_value) VALUES ?", [ranks.map(([role, rank]) => [playerId, role, Number(rank)])]);
}

app.get("/api/health", async (_req, res) => { await db.query("SELECT 1"); res.json({ ok: true }); });
app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const attempt = loginAttempts.get(req.ip);
  if (attempt?.blockedUntil > Date.now()) return res.status(429).json({ error: "Too many attempts. Try again shortly." });
  const [accounts] = await db.execute("SELECT id, username, display_name, password_hash, role, is_active FROM admin_accounts WHERE username = ?", [username]);
  const account = accounts[0];
  const valid = account?.is_active && await verifyPassword(password, account.password_hash);
  if (!valid) {
    const failures = (attempt?.failures || 0) + 1;
    loginAttempts.set(req.ip, { failures, blockedUntil: failures >= 5 ? Date.now() + 5 * 60 * 1000 : 0 });
    return res.status(401).json({ error: "Invalid username or password." });
  }
  loginAttempts.delete(req.ip);
  const session = createSession();
  await db.execute("DELETE FROM admin_sessions WHERE expires_at <= NOW()");
  await db.execute("INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES (?, ?, ?)", [account.id, session.tokenHash, session.expiresAt]);
  await db.execute("UPDATE admin_accounts SET last_login_at = NOW() WHERE id = ?", [account.id]);
  res.setHeader("Set-Cookie", sessionCookie(session.token, session.expiresAt));
  res.json({ id: String(account.id), username: account.username, displayName: account.display_name, role: account.role });
});
app.get("/api/auth/me", requireAuth, (req, res) => res.json({ id: String(req.admin.id), username: req.admin.username, displayName: req.admin.display_name, role: req.admin.role }));
app.post("/api/auth/logout", async (req, res) => { const token = getSessionToken(req); if (token) await db.execute("DELETE FROM admin_sessions WHERE token_hash = ?", [hashToken(token)]); res.setHeader("Set-Cookie", clearSessionCookie()); res.status(204).end(); });

app.get("/api/players", async (_req, res) => res.json(await getPlayers()));
app.post("/api/players", requireAuth, requireWrite, async (req, res) => {
  const { name, notes = "", active = true, roleRanks = {} } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Player name is required." });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute("INSERT INTO players (summoner_name, notes, is_active) VALUES (?, ?, ?)", [name.trim(), notes, active]);
    await saveRanks(connection, result.insertId, roleRanks);
    await connection.commit();
    res.status(201).json((await getPlayers()).find((player) => player.id === String(result.insertId)));
  } catch (error) { await connection.rollback(); res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ error: "Could not create player." }); } finally { connection.release(); }
});
app.put("/api/players/:id", requireAuth, requireWrite, async (req, res) => {
  const { name, notes = "", active = true, roleRanks = {} } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existingPlayers] = await connection.execute("SELECT id FROM players WHERE id = ?", [req.params.id]);
    if (!existingPlayers.length) {
      await connection.rollback();
      return res.status(404).json({ error: "Player not found." });
    }
    const [result] = await connection.execute("UPDATE players SET summoner_name = ?, notes = ?, is_active = ? WHERE id = ?", [name.trim(), notes, active, req.params.id]);
    await connection.execute("DELETE FROM player_role_ranks WHERE player_id = ?", [req.params.id]);
    await saveRanks(connection, req.params.id, roleRanks);
    await connection.commit();
    res.json((await getPlayers()).find((player) => player.id === String(req.params.id)));
  } catch (error) { console.error("Player update failed:", error); await connection.rollback(); res.status(500).json({ error: "Could not update player." }); } finally { connection.release(); }
});
app.delete("/api/players/:id", requireAuth, requireWrite, async (req, res) => { const [result] = await db.execute("DELETE FROM players WHERE id = ?", [req.params.id]); if (!result.affectedRows) return res.status(404).json({ error: "Player not found." }); res.status(204).end(); });

app.get("/api/matches", async (_req, res) => {
  const [matches] = await db.query("SELECT id, played_at, winner_team, notes FROM matches ORDER BY played_at DESC, id DESC");
  const [rows] = await db.query("SELECT mt.match_id, mt.side, mp.player_name, mp.role, mp.rank_at_match, mp.champion_name, mp.kills, mp.deaths, mp.assists, mp.sort_order FROM match_players mp JOIN match_teams mt ON mt.id = mp.match_team_id ORDER BY mp.sort_order");
  res.json(matches.map((match) => ({ id: String(match.id), date: match.played_at.toISOString().slice(0, 10), winner: match.winner_team, notes: match.notes || "", blue: rows.filter((row) => row.match_id === match.id && row.side === "blue").map(formatPlayer), red: rows.filter((row) => row.match_id === match.id && row.side === "red").map(formatPlayer) })));
});
function formatPlayer(row) { return { name: row.player_name, role: row.role, rank: row.rank_at_match || "", champion: row.champion_name || "", kills: row.kills, deaths: row.deaths, assists: row.assists, kda: [row.kills, row.deaths, row.assists].join("/") }; }
app.post("/api/matches", requireAuth, requireWrite, async (req, res) => {
  const { date, winner, notes = "", blue = [], red = [] } = req.body;
  if (!date || !["blue", "red"].includes(winner) || !blue.length || !red.length) return res.status(400).json({ error: "Match data is incomplete." });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [match] = await connection.execute("INSERT INTO matches (played_at, winner_team, notes, created_by) VALUES (?, ?, ?, ?)", [date, winner, notes, req.admin.id]);
    for (const [side, teamPlayers] of [["blue", blue], ["red", red]]) {
      const [team] = await connection.execute("INSERT INTO match_teams (match_id, side) VALUES (?, ?)", [match.insertId, side]);
      for (const [index, player] of teamPlayers.entries()) {
        const [found] = await connection.execute("SELECT id FROM players WHERE normalized_name = LOWER(TRIM(?))", [player.name]);
        await connection.execute("INSERT INTO match_players (match_team_id, player_id, player_name, role, champion_name, rank_at_match, kills, deaths, assists, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [team.insertId, found[0]?.id || null, player.name, player.role, player.champion || null, player.rank || null, Number(player.kills || 0), Number(player.deaths || 0), Number(player.assists || 0), index]);
      }
    }
    await connection.commit();
    res.status(201).json({ id: String(match.insertId) });
  } catch (_error) { await connection.rollback(); res.status(500).json({ error: "Could not save match." }); } finally { connection.release(); }
});
app.delete("/api/matches/:id", requireAuth, requireWrite, async (req, res) => { const [result] = await db.execute("DELETE FROM matches WHERE id = ?", [req.params.id]); if (!result.affectedRows) return res.status(404).json({ error: "Match not found." }); res.status(204).end(); });
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: "Unexpected server error." }); });
app.listen(Number(process.env.PORT || 3001), () => console.log("API listening on port " + (process.env.PORT || 3001)));
