import { useMemo, useState } from "react";
import { getRankLabel, RANKS, ROLES } from "../utils/matches.js";

const emptyRoleRanks = () => Object.fromEntries(ROLES.map((role) => [role, ""]));
const blankPlayer = () => ({ name: "", roleRanks: emptyRoleRanks(), notes: "", active: true });

function getRoleRanks(player) {
  return { ...emptyRoleRanks(), ...(player.roleRanks || {}), ...(player.role ? { [player.role]: player.rank || "" } : {}) };
}

function PlayerEditor({ player, onSave, onCancel }) {
  const [form, setForm] = useState({ ...blankPlayer(), ...player, roleRanks: getRoleRanks(player || {}) });
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  const updateRank = (role) => (event) => setForm({ ...form, roleRanks: { ...form.roleRanks, [role]: event.target.value } });
  function submit(event) { event.preventDefault(); if (form.name.trim()) onSave({ ...form, name: form.name.trim() }); }
  return <form className="player-editor" onSubmit={submit}>
    <label>Player name<input required autoFocus placeholder="Player name" value={form.name} onChange={update("name")} /></label>
    <div className="role-rank-fields"><span className="label">RANK BY ROLE</span>{ROLES.map((role) => <label key={role}>{role}<select value={form.roleRanks[role]} onChange={updateRank(role)}><option value="">Unranked</option>{RANKS.map((rank) => <option value={rank.value} key={rank.value}>{rank.label}</option>)}</select></label>)}</div>
    <label>Notes<input placeholder="Optional notes" value={form.notes} onChange={update("notes")} /></label>
    <label className="active-toggle"><input type="checkbox" checked={form.active} onChange={update("active")} /> Active player</label>
    <div className="editor-actions"><button className="primary-btn" type="submit">Save player <span>-&gt;</span></button><button className="ghost-btn" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}

export default function PlayerDashboard({ players, dataError, onRetry, onSavePlayer, onDeletePlayer, onBack }) {
  const [editing, setEditing] = useState(null);
  const [playerPendingDelete, setPlayerPendingDelete] = useState(null);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => players.filter((player) => player.name.toLowerCase().includes(query.toLowerCase())), [players, query]);
  async function save(player) { await onSavePlayer(player); setEditing(null); }
  async function deletePlayer() {
    await onDeletePlayer(playerPendingDelete.id);
    setPlayerPendingDelete(null);
    if (editing?.id === playerPendingDelete.id) setEditing(null);
  }
  return <main className="player-dashboard">
    <div className="full-leaderboard-head"><div><p className="eyebrow">ROSTER MANAGEMENT</p><h1>Players</h1></div><button className="theme-toggle" onClick={onBack}>Back to dashboard</button></div>
    {dataError && <div className="data-error">Database connection failed: {dataError} <button className="ghost-btn" onClick={onRetry}>Retry</button></div>}
    <section className="player-admin-layout"><div className="panel player-directory"><div className="directory-head"><input type="search" placeholder="Search players..." value={query} onChange={(event) => setQuery(event.target.value)} /><button className="primary-btn add-player-button" onClick={() => setEditing(blankPlayer())}>Add player <span>+</span></button></div><div className="player-directory-head"><span>Player</span><span>Role ranks</span><span>Status</span><span /></div>{filtered.length ? filtered.map((player) => { const ranks = getRoleRanks(player); return <div className="player-directory-row" key={player.id}><strong>{player.name}</strong><span className="role-rank-summary">{ROLES.map((role) => ranks[role] ? <span key={role}>{role.slice(0, 3)} {getRankLabel(ranks[role])}</span> : null)}</span><span className={player.active ? "status-active" : "status-inactive"}>{player.active ? "Active" : "Inactive"}</span><span className="player-row-actions"><button className="ghost-btn" onClick={() => setEditing(player)}>Edit</button><button className="delete" aria-label="Delete player" onClick={() => setPlayerPendingDelete(player)}>x</button></span></div>; }) : <div className="empty">No players found.</div>}</div><aside className="panel player-editor-panel"><p className="eyebrow">{editing?.id ? "EDIT PLAYER" : "NEW PLAYER"}</p><h2>{editing?.id ? editing.name : "Add a player"}</h2>{editing ? <PlayerEditor player={editing} onSave={save} onCancel={() => setEditing(null)} /> : <p className="editor-placeholder">Select a player to edit their role ranks and roster status.</p>}</aside></section>
    {playerPendingDelete && <div className="modal-backdrop confirm-backdrop" onMouseDown={() => setPlayerPendingDelete(null)}><section className="panel confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-player-title" onMouseDown={(event) => event.stopPropagation()}><p className="eyebrow">DELETE PLAYER</p><h2 id="delete-player-title">Delete {playerPendingDelete.name}?</h2><p>Historical match records will remain available.</p><div className="confirm-actions"><button className="ghost-btn" onClick={() => setPlayerPendingDelete(null)}>Cancel</button><button className="danger-btn" onClick={deletePlayer}>Delete player</button></div></section></div>}
  </main>;
}
