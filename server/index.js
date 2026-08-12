import cors from "cors";
import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { clearSessionCookie, createSession, getSessionToken, hashPassword, hashToken, sessionCookie, verifyPassword } from "./auth.js";

const app = express();
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.resolve(serverDirectory, "..", "dist");
const roles = new Set(["Top", "Jungle", "Middle", "Bottom", "Support"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const isProduction = process.env.NODE_ENV === "production";
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const trustProxy = Number(process.env.TRUST_PROXY || 0);
const dummyPasswordHash = "scrypt$0123456789abcdef0123456789abcdef$693614e72597f21adf75adf1f99bba137e396f41c5af83d232841071e83862e5d16e5c116d867fec9d069120328590be45014c5c926d8796a7e6022b4ab9c67c";
const apiWindows = new Map();
const databaseHost = String(process.env.DB_HOST || "").toLowerCase();
const isPrivateDatabaseHost = ["127.0.0.1", "localhost", "::1"].includes(databaseHost)
  || databaseHost.endsWith(".railway.internal");

if (isProduction) {
  if (!clientOrigin.startsWith("https://")) throw new Error("CLIENT_ORIGIN must use HTTPS in production.");
  if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === "change_me") throw new Error("Set a non-placeholder DB_PASSWORD in production.");
  if (!isPrivateDatabaseHost && process.env.DB_SSL !== "true") throw new Error("Set DB_SSL=true for a public production database.");
}
if (!Number.isInteger(trustProxy) || trustProxy < 0 || trustProxy > 5) throw new Error("TRUST_PROXY must be an integer from 0 to 5.");
if (trustProxy) app.set("trust proxy", trustProxy);
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https://ddragon.leagueoflegends.com https://raw.communitydragon.org; connect-src 'self' https://ddragon.leagueoflegends.com; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProduction) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
app.use(cors({ origin: clientOrigin, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json({ limit: "100kb" }));
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  const now = Date.now();
  const key = req.ip;
  const current = apiWindows.get(key);
  const windowState = !current || current.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : current;
  windowState.count += 1;
  apiWindows.set(key, windowState);
  if (apiWindows.size > 5000) {
    for (const [entryKey, value] of apiWindows) if (value.resetAt <= now) apiWindows.delete(entryKey);
    while (apiWindows.size > 5000) apiWindows.delete(apiWindows.keys().next().value);
  }
  res.setHeader("RateLimit-Limit", "120");
  res.setHeader("RateLimit-Remaining", String(Math.max(0, 120 - windowState.count)));
  res.setHeader("RateLimit-Reset", String(Math.ceil(windowState.resetAt / 1000)));
  if (windowState.count > 120) return res.status(429).json({ error: "Too many requests. Try again shortly." });
  next();
});
app.use("/api", (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (origin && origin !== clientOrigin) return res.status(403).json({ error: "Request origin is not allowed." });
  next();
});

function isValidDate(value) {
  if (!datePattern.test(String(value))) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

async function findAdmin(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const [rows] = await db.execute("SELECT a.id, a.username, a.display_name, a.role FROM admin_sessions s JOIN admin_accounts a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > NOW() AND a.is_active = TRUE", [hashToken(token)]);
  return rows[0] || null;
}

async function requireAuth(req, res, next) {
  req.admin = await findAdmin(req);
  if (!req.admin) return res.status(401).json({ error: "Authentication required or session expired." });
  next();
}

function requireWrite(req, res, next) {
  if (!new Set(["owner", "admin"]).has(req.admin.role)) return res.status(403).json({ error: "Write access required." });
  next();
}

const playerQuery = "SELECT p.id, p.summoner_name, p.is_active, p.notes, COALESCE((SELECT JSON_OBJECTAGG(prr.role, prr.rank_value) FROM player_role_ranks prr WHERE prr.player_id = p.id), JSON_OBJECT()) AS role_ranks FROM players p ORDER BY p.summoner_name";
async function getPlayers(includePrivate = false) {
  const [rows] = await db.query(playerQuery);
  return rows.map((row) => includePrivate
    ? { id: String(row.id), name: row.summoner_name, active: Boolean(row.is_active), notes: row.notes || "", roleRanks: row.role_ranks || {} }
    : { id: String(row.id), name: row.summoner_name });
}
async function saveRanks(connection, playerId, roleRanks) {
  const ranks = Object.entries(roleRanks || {}).filter(([role, rank]) => roles.has(role) && Number.isInteger(Number(rank)) && Number(rank) >= 1 && Number(rank) <= 10);
  if (ranks.length) await connection.query("INSERT INTO player_role_ranks (player_id, role, rank_value) VALUES ?", [ranks.map(([role, rank]) => [playerId, role, Number(rank)])]);
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function validateTeam(teamPlayers, side) {
  if (!Array.isArray(teamPlayers) || teamPlayers.length !== 5) return `${side} team must contain exactly five players.`;
  const names = teamPlayers.map((player) => cleanText(player?.name, 100).toLowerCase());
  if (names.some((name) => !name)) return `Every ${side} team player needs a name.`;
  if (new Set(names).size !== 5) return `${side} team contains duplicate players.`;
  if (teamPlayers.some((player) => !roles.has(player?.role))) return `Every ${side} team player needs a valid role.`;
  if (new Set(teamPlayers.map((player) => player.role)).size !== 5) return `${side} team must use each role once.`;
  if (teamPlayers.some((player) => !cleanText(player?.champion, 80))) return `Every ${side} team player needs a champion.`;
  if (teamPlayers.some((player) => [player.kills, player.deaths, player.assists].some((value) => value === "" || value === null || value === undefined || !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 65535))) return `${side} team K/D/A values must be whole numbers between 0 and 65535.`;
  return "";
}

app.get("/api/health", async (_req, res) => { await db.query("SELECT 1"); res.json({ ok: true }); });
app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (username.length > 32 || password.length > 256) return res.status(400).json({ error: "Invalid username or password." });
  const attemptKey = hashToken(req.ip);
  await db.execute("DELETE FROM auth_login_attempts WHERE updated_at < DATE_SUB(NOW(), INTERVAL 1 DAY)");
  const [attempts] = await db.execute("SELECT blocked_until FROM auth_login_attempts WHERE attempt_key = ?", [attemptKey]);
  if (attempts[0]?.blocked_until && new Date(attempts[0].blocked_until) > new Date()) return res.status(429).json({ error: "Too many attempts. Try again shortly." });
  const [accounts] = await db.execute("SELECT id, username, display_name, password_hash, role, is_active FROM admin_accounts WHERE username = ?", [username]);
  const account = accounts[0];
  const passwordValid = await verifyPassword(password, account?.password_hash || dummyPasswordHash);
  const valid = Boolean(account?.is_active && passwordValid);
  if (!valid) {
    await db.execute(`INSERT INTO auth_login_attempts (attempt_key, failures, window_started_at, blocked_until)
      VALUES (?, 1, NOW(), NULL)
      ON DUPLICATE KEY UPDATE
        blocked_until = IF(window_started_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE), NULL, IF(failures + 1 >= 5, DATE_ADD(NOW(), INTERVAL 5 MINUTE), blocked_until)),
        failures = IF(window_started_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE), 1, LEAST(failures + 1, 255)),
        window_started_at = IF(window_started_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE), NOW(), window_started_at)`, [attemptKey]);
    return res.status(401).json({ error: "Invalid username or password." });
  }
  await db.execute("DELETE FROM auth_login_attempts WHERE attempt_key = ? OR updated_at < DATE_SUB(NOW(), INTERVAL 1 DAY)", [attemptKey]);
  const session = createSession();
  await db.execute("DELETE FROM admin_sessions WHERE expires_at <= NOW()");
  await db.execute("INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES (?, ?, ?)", [account.id, session.tokenHash, session.expiresAt]);
  await db.execute("UPDATE admin_accounts SET last_login_at = NOW() WHERE id = ?", [account.id]);
  res.setHeader("Set-Cookie", sessionCookie(session.token, session.expiresAt));
  res.json({ id: String(account.id), username: account.username, displayName: account.display_name, role: account.role });
});
app.get("/api/auth/me", requireAuth, (req, res) => res.json({ id: String(req.admin.id), username: req.admin.username, displayName: req.admin.display_name, role: req.admin.role }));
app.patch("/api/auth/profile", requireAuth, async (req, res) => {
  const displayName = String(req.body?.displayName || "").trim();
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  if (displayName.length < 2 || displayName.length > 120) return res.status(400).json({ error: "Display name must be between 2 and 120 characters." });
  if (newPassword && newPassword.length < 12) return res.status(400).json({ error: "New password must be at least 12 characters." });
  if (currentPassword.length > 256 || newPassword.length > 256) return res.status(400).json({ error: "Password must be 256 characters or fewer." });

  if (newPassword) {
    const [accounts] = await db.execute("SELECT password_hash FROM admin_accounts WHERE id = ?", [req.admin.id]);
    if (!currentPassword || !await verifyPassword(currentPassword, accounts[0]?.password_hash)) return res.status(400).json({ error: "Current password is incorrect." });
    const passwordHash = await hashPassword(newPassword);
    await db.execute("UPDATE admin_accounts SET display_name = ?, password_hash = ? WHERE id = ?", [displayName, passwordHash, req.admin.id]);
    await db.execute("DELETE FROM admin_sessions WHERE admin_id = ? AND token_hash <> ?", [req.admin.id, hashToken(getSessionToken(req))]);
  } else {
    await db.execute("UPDATE admin_accounts SET display_name = ? WHERE id = ?", [displayName, req.admin.id]);
  }

  res.json({ id: String(req.admin.id), username: req.admin.username, displayName, role: req.admin.role });
});
app.post("/api/auth/logout", async (req, res) => { const token = getSessionToken(req); if (token) await db.execute("DELETE FROM admin_sessions WHERE token_hash = ?", [hashToken(token)]); res.setHeader("Set-Cookie", clearSessionCookie()); res.status(204).end(); });

app.get("/api/players", async (req, res) => res.json(await getPlayers(Boolean(await findAdmin(req)))));
app.post("/api/players", requireAuth, requireWrite, async (req, res) => {
  const { name, notes = "", active = true, roleRanks = {} } = req.body || {};
  const playerName = cleanText(name, 100);
  if (!playerName) return res.status(400).json({ error: "Player name is required." });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute("INSERT INTO players (summoner_name, notes, is_active) VALUES (?, ?, ?)", [playerName, cleanText(notes, 2000), Boolean(active)]);
    await saveRanks(connection, result.insertId, roleRanks);
    await connection.commit();
    res.status(201).json((await getPlayers(true)).find((player) => player.id === String(result.insertId)));
  } catch (error) { await connection.rollback(); res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ error: "Could not create player." }); } finally { connection.release(); }
});
app.put("/api/players/:id", requireAuth, requireWrite, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid player ID." });
  const { name, notes = "", active = true, roleRanks = {} } = req.body || {};
  const playerName = cleanText(name, 100);
  if (!playerName) return res.status(400).json({ error: "Player name is required." });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existingPlayers] = await connection.execute("SELECT id FROM players WHERE id = ?", [req.params.id]);
    if (!existingPlayers.length) {
      await connection.rollback();
      return res.status(404).json({ error: "Player not found." });
    }
    await connection.execute("UPDATE players SET summoner_name = ?, notes = ?, is_active = ? WHERE id = ?", [playerName, cleanText(notes, 2000), Boolean(active), req.params.id]);
    await connection.execute("DELETE FROM player_role_ranks WHERE player_id = ?", [req.params.id]);
    await saveRanks(connection, req.params.id, roleRanks);
    await connection.commit();
    res.json((await getPlayers(true)).find((player) => player.id === String(req.params.id)));
  } catch (error) { console.error("Player update failed:", error); await connection.rollback(); res.status(500).json({ error: "Could not update player." }); } finally { connection.release(); }
});
app.delete("/api/players/:id", requireAuth, requireWrite, async (req, res) => { if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid player ID." }); const [result] = await db.execute("DELETE FROM players WHERE id = ?", [req.params.id]); if (!result.affectedRows) return res.status(404).json({ error: "Player not found." }); res.status(204).end(); });

app.get("/api/matches", async (req, res) => {
  const includePrivate = Boolean(await findAdmin(req));
  const [matches] = await db.query("SELECT id, DATE_FORMAT(played_at, '%Y-%m-%d') AS played_date, winner_team, match_type, notes FROM matches ORDER BY played_at DESC, id DESC LIMIT 500");
  if (!matches.length) return res.json([]);
  const [rows] = await db.query("SELECT mt.match_id, mt.side, mp.player_name, mp.role, mp.rank_at_match, mp.champion_name, mp.kills, mp.deaths, mp.assists, mp.sort_order FROM match_players mp JOIN match_teams mt ON mt.id = mp.match_team_id WHERE mt.match_id IN (?) ORDER BY mt.match_id DESC, mp.sort_order", [matches.map((match) => match.id)]);
  const teamsByMatch = new Map();
  rows.forEach((row) => {
    if (!teamsByMatch.has(row.match_id)) teamsByMatch.set(row.match_id, { blue: [], red: [] });
    teamsByMatch.get(row.match_id)[row.side].push(formatPlayer(row));
  });
  res.json(matches.map((match) => {
    const teams = teamsByMatch.get(match.id) || { blue: [], red: [] };
    return { id: String(match.id), date: match.played_date, winner: match.winner_team, matchType: match.match_type, notes: includePrivate ? match.notes || "" : "", ...teams };
  }));
});
function formatPlayer(row) { return { name: row.player_name, role: row.role, rank: row.rank_at_match || "", champion: row.champion_name || "", kills: row.kills, deaths: row.deaths, assists: row.assists, kda: [row.kills, row.deaths, row.assists].join("/") }; }
app.post("/api/matches", requireAuth, requireWrite, async (req, res) => {
  const { date, winner, matchType = "manual", notes = "", blue = [], red = [] } = req.body || {};
  if (!isValidDate(date)) return res.status(400).json({ error: "A valid match date is required." });
  if (!["blue", "red"].includes(winner)) return res.status(400).json({ error: "A winning team is required." });
  if (!["manual", "spin"].includes(matchType)) return res.status(400).json({ error: "A valid match type is required." });
  const blueError = validateTeam(blue, "Blue");
  const redError = validateTeam(red, "Red");
  if (blueError || redError) return res.status(400).json({ error: blueError || redError });
  const allNames = [...blue, ...red].map((player) => cleanText(player.name, 100).toLowerCase());
  if (new Set(allNames).size !== 10) return res.status(400).json({ error: "A player cannot appear on both teams." });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [match] = await connection.execute("INSERT INTO matches (played_at, winner_team, match_type, notes, created_by) VALUES (?, ?, ?, ?, ?)", [date, winner, matchType, cleanText(notes, 2000), req.admin.id]);
    for (const [side, teamPlayers] of [["blue", blue], ["red", red]]) {
      const [team] = await connection.execute("INSERT INTO match_teams (match_id, side) VALUES (?, ?)", [match.insertId, side]);
      for (const [index, player] of teamPlayers.entries()) {
        const playerName = cleanText(player.name, 100);
        const [found] = await connection.execute("SELECT id FROM players WHERE normalized_name = LOWER(TRIM(?))", [playerName]);
        await connection.execute("INSERT INTO match_players (match_team_id, player_id, player_name, role, champion_name, rank_at_match, kills, deaths, assists, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [team.insertId, found[0]?.id || null, playerName, player.role, cleanText(player.champion, 80), null, Number(player.kills), Number(player.deaths), Number(player.assists), index]);
      }
    }
    await connection.commit();
    res.status(201).json({ id: String(match.insertId) });
  } catch (error) { console.error("Match save failed:", error); await connection.rollback(); res.status(500).json({ error: "Could not save match." }); } finally { connection.release(); }
});
app.delete("/api/matches/:id", requireAuth, requireWrite, async (req, res) => { if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid match ID." }); const [result] = await db.execute("DELETE FROM matches WHERE id = ?", [req.params.id]); if (!result.affectedRows) return res.status(404).json({ error: "Match not found." }); res.status(204).end(); });
app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found." }));
if (isProduction) {
  app.use(express.static(distDirectory, { index: false, maxAge: "1h" }));
  app.get("/{*path}", (_req, res) => res.sendFile(path.join(distDirectory, "index.html")));
}
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: "Unexpected server error." }); });
app.listen(Number(process.env.PORT || 3001), () => console.log("API listening on port " + (process.env.PORT || 3001)));
