import { useEffect, useState } from "react";
import { ROLES, today } from "../utils/matches.js";
import ChampionPicker from "./ChampionPicker.jsx";
import DiscardConfirmation from "./DiscardConfirmation.jsx";

const newPlayer = () => ({ name: "", role: "", champion: "", kills: "", deaths: "", assists: "" });
const newTeam = () => Array.from({ length: 5 }, newPlayer);
const fillTeam = (players) => newTeam().map((player, index) => ({ ...player, ...(players?.[index] || {}) }));
const emptyForm = (initialTeams) => ({ date: today(), blue: fillTeam(initialTeams?.blue), red: fillTeam(initialTeams?.red), winner: "", notes: "" });

function TeamEditor({ team, players, savedPlayers, champions, isChampionLibraryLoading, isActive, onChange }) {
  const update = (index, field, value) => onChange(players.map((player, playerIndex) => playerIndex === index ? { ...player, [field]: value } : player));
  const selectPlayer = (index, name) => {
    const saved = savedPlayers.find((player) => player.name.toLowerCase() === name.toLowerCase());
    const role = saved?.roleRanks ? Object.keys(saved.roleRanks).find((key) => saved.roleRanks[key]) || "" : saved?.role || "";
    onChange(players.map((player, playerIndex) => playerIndex === index ? { ...player, name, role } : player));
  };
  const selectRole = (index, role) => {
    onChange(players.map((player, playerIndex) => {
      if (playerIndex !== index) return player;
      return { ...player, role };
    }));
  };
  return <div className={'team-editor ' + team + (isActive ? ' active' : ' inactive')}>
    <div className="team-title"><span className="team-dot" />{team.toUpperCase()} TEAM <span>{players.length}/5</span></div>
    <div className="player-entry-head"><span>Player</span><span>Role</span><span>Champion</span><span>K / D / A</span></div>
    {players.map((player, index) => <div className="player-entry" data-player-number={index + 1} key={index}>
      <input list="player-options" required placeholder="Search player" value={player.name} onChange={(event) => selectPlayer(index, event.target.value)} />
      <select required value={player.role} onChange={(event) => selectRole(index, event.target.value)}><option value="">Role</option>{ROLES.map((role) => <option key={role}>{role}</option>)}</select>
      <ChampionPicker champions={champions} value={player.champion} isLoading={isChampionLibraryLoading} onChange={(champion) => update(index, 'champion', champion)} />
      <div className="kda-inputs"><input type="number" min="0" max="65535" step="1" required aria-label="Kills" placeholder="K" value={player.kills} onChange={(event) => update(index, 'kills', event.target.value)} /><input type="number" min="0" max="65535" step="1" required aria-label="Deaths" placeholder="D" value={player.deaths} onChange={(event) => update(index, 'deaths', event.target.value)} /><input type="number" min="0" max="65535" step="1" required aria-label="Assists" placeholder="A" value={player.assists} onChange={(event) => update(index, 'assists', event.target.value)} /></div>
    </div>)}
  </div>
}

export default function MatchForm({ onAddMatch, onClose, playerNames, champions, savedPlayers, isChampionLibraryLoading, championLibraryError, initialTeams }) {
  const [form, setForm] = useState(() => emptyForm(initialTeams));
  const [activeTeam, setActiveTeam] = useState('blue');
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { const closeOnEscape = (event) => { if (event.key === 'Escape' && !isCloseConfirmationOpen) setIsCloseConfirmationOpen(true); }; window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape); }, [isCloseConfirmationOpen]);
  async function submit(event) {
    event.preventDefault();
    setError("");
    const allPlayers = [...form.blue, ...form.red];
    const names = allPlayers.map((player) => player.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) return setError("Each player can only appear once in a match.");
    for (const [teamName, team] of [["Blue", form.blue], ["Red", form.red]]) {
      if (new Set(team.map((player) => player.role)).size !== ROLES.length) return setError(`${teamName} team must use each role once.`);
      if (team.some((player) => !player.champion)) return setError(`Select a champion for every ${teamName.toLowerCase()} team player.`);
    }
    const toPlayer = (player) => ({ ...player, name: player.name.trim(), kda: [Number(player.kills), Number(player.deaths), Number(player.assists)].join('/') });
    setIsSubmitting(true);
    try {
      await onAddMatch({ date: form.date, blue: form.blue.map(toPlayer), red: form.red.map(toPlayer), winner: form.winner, notes: form.notes.trim() });
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Could not save match.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return <div className="modal-backdrop" onMouseDown={() => setIsCloseConfirmationOpen(true)}><div className="panel entry-panel modal-panel" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
    <div className="panel-head"><div><p className="eyebrow">NEW ENTRY</p><h2>Log a custom</h2></div><button className="modal-close" type="button" onClick={() => setIsCloseConfirmationOpen(true)}>x</button></div>
    <datalist id="player-options">{playerNames.map((name) => <option value={name} key={name} />)}</datalist>
    <form onSubmit={submit}><label>Date<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>{championLibraryError && <div className="login-error">Champion library unavailable: {championLibraryError}</div>}<div className="mobile-team-tabs" role="tablist" aria-label="Teams">{['blue', 'red'].map((team) => <button className={activeTeam === team ? 'active' : ''} type="button" role="tab" aria-selected={activeTeam === team} key={team} onClick={() => setActiveTeam(team)}><span className={'team-dot ' + team} />{team[0].toUpperCase() + team.slice(1)} team</button>)}</div><div className="team-editors"><TeamEditor team="blue" players={form.blue} savedPlayers={savedPlayers} champions={champions} isChampionLibraryLoading={isChampionLibraryLoading} isActive={activeTeam === 'blue'} onChange={(blue) => setForm({ ...form, blue })} /><TeamEditor team="red" players={form.red} savedPlayers={savedPlayers} champions={champions} isChampionLibraryLoading={isChampionLibraryLoading} isActive={activeTeam === 'red'} onChange={(red) => setForm({ ...form, red })} /></div><div className="winner-row"><span className="label">WINNER</span><div className="winner-options">{['blue', 'red'].map((team) => <label key={team}><input type="radio" name="winner" required value={team} checked={form.winner === team} onChange={(event) => setForm({ ...form, winner: event.target.value })} /><span>{team[0].toUpperCase() + team.slice(1)} team</span></label>)}</div></div><label>Notes<input maxLength="2000" placeholder="Optional context" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>{error && <div className="login-error" role="alert">{error}</div>}<button className="primary-btn" type="submit" disabled={isSubmitting || Boolean(championLibraryError)}>{isSubmitting ? "Saving match..." : "Save match"} <span>-&gt;</span></button></form>
  </div>{isCloseConfirmationOpen && <DiscardConfirmation title="Close this match?" message="The teams, champions, and K/D/A values you entered will be lost." onCancel={() => setIsCloseConfirmationOpen(false)} onDiscard={onClose} />}</div>;
}
