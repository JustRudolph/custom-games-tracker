import { useEffect, useState } from "react";
import { RANKS, ROLES, today } from "../utils/matches.js";
import ChampionPicker from "./ChampionPicker.jsx";

const newPlayer = () => ({ name: "", role: "", rank: "", champion: "", kills: "", deaths: "", assists: "" });
const newTeam = () => Array.from({ length: 5 }, newPlayer);
const emptyForm = () => ({ date: today(), blue: newTeam(), red: newTeam(), winner: "", notes: "" });

function TeamEditor({ team, players, savedPlayers, champions, isChampionLibraryLoading, onChange }) {
  const update = (index, field, value) => onChange(players.map((player, playerIndex) => playerIndex === index ? { ...player, [field]: value } : player));
  const selectPlayer = (index, name) => {
    const saved = savedPlayers.find((player) => player.name.toLowerCase() === name.toLowerCase());
    const role = saved?.roleRanks ? Object.keys(saved.roleRanks).find((key) => saved.roleRanks[key]) || "" : saved?.role || "";
    const rank = saved?.roleRanks?.[role] || saved?.rank || "";
    onChange(players.map((player, playerIndex) => playerIndex === index ? { ...player, name, role, rank } : player));
  };
  const selectRole = (index, role) => {
    const saved = savedPlayers.find((player) => player.name.toLowerCase() === players[index].name.toLowerCase());
    onChange(players.map((player, playerIndex) => {
      if (playerIndex !== index) return player;
      return { ...player, role, rank: saved?.roleRanks?.[role] || player.rank };
    }));
  };
  return <div className={'team-editor ' + team}>
    <div className="team-title"><span className="team-dot" />{team.toUpperCase()} TEAM <span>{players.length}/5</span></div>
    <div className="player-entry-head"><span>Player</span><span>Role</span><span>Rank</span><span>Champion</span><span>K / D / A</span></div>
    {players.map((player, index) => <div className="player-entry" key={index}>
      <input list="player-options" required placeholder="Search player" value={player.name} onChange={(event) => selectPlayer(index, event.target.value)} />
      <select required value={player.role} onChange={(event) => selectRole(index, event.target.value)}><option value="">Role</option>{ROLES.map((role) => <option key={role}>{role}</option>)}</select>
      <select value={player.rank} onChange={(event) => update(index, 'rank', event.target.value)}><option value="">Rank</option>{RANKS.map((rank) => <option key={rank.value} value={rank.value}>{rank.label}</option>)}</select>
      <ChampionPicker champions={champions} value={player.champion} isLoading={isChampionLibraryLoading} onChange={(champion) => update(index, 'champion', champion)} />
      <div className="kda-inputs"><input type="number" min="0" aria-label="Kills" placeholder="K" value={player.kills} onChange={(event) => update(index, 'kills', event.target.value)} /><input type="number" min="0" aria-label="Deaths" placeholder="D" value={player.deaths} onChange={(event) => update(index, 'deaths', event.target.value)} /><input type="number" min="0" aria-label="Assists" placeholder="A" value={player.assists} onChange={(event) => update(index, 'assists', event.target.value)} /></div>
    </div>)}
  </div>
}

export default function MatchForm({ onAddMatch, onClose, playerNames, champions, savedPlayers, isChampionLibraryLoading }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { const closeOnEscape = (event) => event.key === 'Escape' && onClose(); window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape); }, [onClose]);
  async function submit(event) { event.preventDefault(); const toPlayer = (player) => ({ ...player, kda: [Number(player.kills || 0), Number(player.deaths || 0), Number(player.assists || 0)].join('/') }); await onAddMatch({ date: form.date, blue: form.blue.map(toPlayer), red: form.red.map(toPlayer), winner: form.winner, notes: form.notes.trim() }); onClose(); }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="panel entry-panel modal-panel" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
    <div className="panel-head"><div><p className="eyebrow">NEW ENTRY</p><h2>Log a custom</h2></div><button className="modal-close" type="button" onClick={onClose}>x</button></div>
    <datalist id="player-options">{playerNames.map((name) => <option value={name} key={name} />)}</datalist>
    <form onSubmit={submit}><label>Date<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><div className="team-editors"><TeamEditor team="blue" players={form.blue} savedPlayers={savedPlayers} champions={champions} isChampionLibraryLoading={isChampionLibraryLoading} onChange={(blue) => setForm({ ...form, blue })} /><TeamEditor team="red" players={form.red} savedPlayers={savedPlayers} champions={champions} isChampionLibraryLoading={isChampionLibraryLoading} onChange={(red) => setForm({ ...form, red })} /></div><div className="winner-row"><span className="label">WINNER</span><div className="winner-options">{['blue', 'red'].map((team) => <label key={team}><input type="radio" name="winner" required value={team} checked={form.winner === team} onChange={(event) => setForm({ ...form, winner: event.target.value })} /><span>{team[0].toUpperCase() + team.slice(1)} team</span></label>)}</div></div><label>Notes<input placeholder="Optional context" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label><button className="primary-btn" type="submit">Save match <span>-&gt;</span></button></form>
  </div></div>;
}
