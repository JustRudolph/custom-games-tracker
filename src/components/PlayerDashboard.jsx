import { useMemo, useState } from "react";
import { getRankLabel, RANKS, ROLES } from "../utils/matches.js";
import ConfirmationModal from "./ConfirmationModal.jsx";

const emptyRoleRanks = () => Object.fromEntries(ROLES.map((role) => [role, ""]));
const blankPlayer = () => ({ name: "", roleRanks: emptyRoleRanks(), notes: "", active: true });

function getRoleRanks(player) {
  return { ...emptyRoleRanks(), ...(player.roleRanks || {}), ...(player.role ? { [player.role]: player.rank || "" } : {}) };
}

function PlayerEditor({ player, onSave, onCancel }) {
  const [form, setForm] = useState({ ...blankPlayer(), ...player, roleRanks: getRoleRanks(player || {}) });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  const updateRank = (role) => (event) => setForm({ ...form, roleRanks: { ...form.roleRanks, [role]: event.target.value } });
  async function submit(event) { event.preventDefault(); if (!form.name.trim() || isSaving) return; setError(""); setIsSaving(true); try { await onSave({ ...form, name: form.name.trim() }); } catch (saveError) { setError(saveError.message || "Could not save player."); } finally { setIsSaving(false); } }
  return <form className="player-editor" onSubmit={submit}>
    <label>Player name<input required maxLength="100" autoFocus placeholder="Player name" value={form.name} onChange={update("name")} /></label>
    <div className="role-rank-fields"><span className="label">RANK BY ROLE</span>{ROLES.map((role) => <label key={role}>{role}<select value={form.roleRanks[role]} onChange={updateRank(role)}><option value="">Unranked</option>{RANKS.map((rank) => <option value={rank.value} key={rank.value}>{rank.label}</option>)}</select></label>)}</div>
    <label>Notes<input maxLength="2000" placeholder="Optional notes" value={form.notes} onChange={update("notes")} /></label>
    <label className="active-toggle"><input type="checkbox" checked={form.active} onChange={update("active")} /> Active player</label>
    {error && <div className="login-error" role="alert">{error}</div>}
    <div className="editor-actions"><button className="primary-btn" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save player"} <span>-&gt;</span></button><button className="ghost-btn" type="button" disabled={isSaving} onClick={onCancel}>Cancel</button></div>
  </form>;
}

export default function PlayerDashboard({ players, dataError, canWrite, onRetry, onSavePlayer, onDeletePlayer, onBack }) {
  const [editing, setEditing] = useState(null);
  const [playerPendingDelete, setPlayerPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => players.filter((player) => player.name.toLowerCase().includes(query.toLowerCase())), [players, query]);
  async function save(player) { await onSavePlayer(player); setEditing(null); }
  async function deletePlayer() { if (!playerPendingDelete || isDeleting) return; setDeleteError(""); setIsDeleting(true); try { await onDeletePlayer(playerPendingDelete.id); if (editing?.id === playerPendingDelete.id) setEditing(null); setPlayerPendingDelete(null); } catch (error) { setDeleteError(error.message || "Could not delete player."); } finally { setIsDeleting(false); } }
  return <main className="player-dashboard">
    <div className="full-leaderboard-head"><div><p className="eyebrow">ROSTER MANAGEMENT</p><h1>Players</h1></div><button className="theme-toggle" onClick={onBack}>Back to dashboard</button></div>
    {dataError && <div className="data-error">Database connection failed: {dataError} <button className="ghost-btn" onClick={onRetry}>Retry</button></div>}
    <section className={"player-admin-layout " + (canWrite ? "" : "read-only")}><div className="panel player-directory"><div className="directory-head"><input type="search" placeholder="Search players..." value={query} onChange={(event) => setQuery(event.target.value)} />{canWrite && <button className="primary-btn add-player-button" onClick={() => setEditing(blankPlayer())}>Add player <span>+</span></button>}</div><div className="player-directory-head"><span>Player</span><span>Role ranks</span><span>Status</span><span /></div>{filtered.length ? filtered.map((player) => { const ranks = getRoleRanks(player); return <div className="player-directory-row" key={player.id}><strong>{player.name}</strong><span className="role-rank-summary">{ROLES.map((role) => ranks[role] ? <span key={role}>{role.slice(0, 3)} {getRankLabel(ranks[role])}</span> : null)}</span><span className={player.active ? "status-active" : "status-inactive"}>{player.active ? "Active" : "Inactive"}</span><span className="player-row-actions">{canWrite ? <><button className="ghost-btn" onClick={() => setEditing(player)}>Edit</button><button className="delete" aria-label="Delete player" onClick={() => { setDeleteError(""); setPlayerPendingDelete(player); }}>x</button></> : "-"}</span></div>; }) : <div className="empty">No players found.</div>}</div>{canWrite && <aside className="panel player-editor-panel"><p className="eyebrow">{editing?.id ? "EDIT PLAYER" : "NEW PLAYER"}</p><h2>{editing?.id ? editing.name : "Add a player"}</h2>{editing ? <PlayerEditor key={editing.id || "new"} player={editing} onSave={save} onCancel={() => setEditing(null)} /> : <p className="editor-placeholder">Select a player to edit their role ranks and roster status.</p>}</aside>}</section>
    {playerPendingDelete && <ConfirmationModal eyebrow="DELETE PLAYER" title={`Delete ${playerPendingDelete.name}?`} message="Historical match records will remain available." confirmLabel="Delete player" isWorking={isDeleting} error={deleteError} onCancel={() => setPlayerPendingDelete(null)} onConfirm={deletePlayer} />}
  </main>;
}
