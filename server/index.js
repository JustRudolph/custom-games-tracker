import cors from "cors";
import "dotenv/config";
import express from "express";
import { db } from "./db.js";

const app = express();
const roles = new Set(["Top", "Jungle", "Middle", "Bottom", "Support"]);
app.use(cors());
app.use(express.json());

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
app.get("/api/players", async (_req, res) => res.json(await getPlayers()));
app.post("/api/players", async (req, res) => {
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
app.put("/api/players/:id", async (req, res) => {
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
app.delete("/api/players/:id", async (req, res) => { const [result] = await db.execute("DELETE FROM players WHERE id = ?", [req.params.id]); if (!result.affectedRows) return res.status(404).json({ error: "Player not found." }); res.status(204).end(); });

app.get("/api/matches", async (_req, res) => {
  const [matches] = await db.query("SELECT id, played_at, winner_team, notes FROM matches ORDER BY played_at DESC, id DESC");
  const [rows] = await db.query("SELECT mt.match_id, mt.side, mp.player_name, mp.role, mp.rank_at_match, mp.champion_name, mp.kills, mp.deaths, mp.assists, mp.sort_order FROM match_players mp JOIN match_teams mt ON mt.id = mp.match_team_id ORDER BY mp.sort_order");
  res.json(matches.map((match) => ({ id: String(match.id), date: match.played_at.toISOString().slice(0, 10), winner: match.winner_team, notes: match.notes || "", blue: rows.filter((row) => row.match_id === match.id && row.side === "blue").map(formatPlayer), red: rows.filter((row) => row.match_id === match.id && row.side === "red").map(formatPlayer) })));
});
function formatPlayer(row) { return { name: row.player_name, role: row.role, rank: row.rank_at_match || "", champion: row.champion_name || "", kills: row.kills, deaths: row.deaths, assists: row.assists, kda: [row.kills, row.deaths, row.assists].join("/") }; }
app.post("/api/matches", async (req, res) => {
  const { date, winner, notes = "", blue = [], red = [] } = req.body;
  if (!date || !["blue", "red"].includes(winner) || !blue.length || !red.length) return res.status(400).json({ error: "Match data is incomplete." });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [match] = await connection.execute("INSERT INTO matches (played_at, winner_team, notes) VALUES (?, ?, ?)", [date, winner, notes]);
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
app.delete("/api/matches/:id", async (req, res) => { const [result] = await db.execute("DELETE FROM matches WHERE id = ?", [req.params.id]); if (!result.affectedRows) return res.status(404).json({ error: "Match not found." }); res.status(204).end(); });
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: "Unexpected server error." }); });
app.listen(Number(process.env.PORT || 3001), () => console.log("API listening on port " + (process.env.PORT || 3001)));
