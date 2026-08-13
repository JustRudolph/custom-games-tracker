import { useEffect, useState } from "react";
import { ROLES, today } from "../utils/matches.js";
import { findFirstPlayerMatch } from "../utils/players.js";
import ChampionPicker from "./ChampionPicker.jsx";
import DiscardConfirmation from "./DiscardConfirmation.jsx";

const newPlayer = (role) => ({ name: "", role, champion: "", kills: "", deaths: "", assists: "" });
const newTeam = () => ROLES.map(newPlayer);
const fillTeam = (players) => newTeam().map((player, index) => {
  const initialPlayer = players?.[index];
  return {
    ...player,
    ...initialPlayer,
    role: initialPlayer?.role || player.role,
  };
});
const emptyForm = (initialTeams) => ({ id: initialTeams?.id, date: initialTeams?.date || today(), blue: fillTeam(initialTeams?.blue), red: fillTeam(initialTeams?.red), winner: initialTeams?.winner || "", matchType: initialTeams?.matchType || "manual", status: initialTeams?.status || "complete", notes: initialTeams?.notes || "" });

function TeamEditor({ team, players, playerNames, champions, isChampionLibraryLoading, isActive, onChange }) {
  const update = (index, field, value) => onChange(players.map((player, playerIndex) => playerIndex === index ? { ...player, [field]: value } : player));
  const selectPlayer = (index, name) => update(index, "name", name);
  const selectFirstMatchingPlayer = (event, index) => {
    if (event.key !== "Enter") return;

    const match = findFirstPlayerMatch(playerNames, event.currentTarget.value);
    if (!match) return;

    event.preventDefault();
    selectPlayer(index, match);
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
      <input list="player-options" required placeholder="Search player" value={player.name} onChange={(event) => selectPlayer(index, event.target.value)} onKeyDown={(event) => selectFirstMatchingPlayer(event, index)} />
      <select required value={player.role} onChange={(event) => selectRole(index, event.target.value)}><option value="">Role</option>{ROLES.map((role) => <option key={role}>{role}</option>)}</select>
      <ChampionPicker champions={champions} value={player.champion} isLoading={isChampionLibraryLoading} onChange={(champion) => update(index, 'champion', champion)} />
      <div className="kda-inputs"><input type="number" min="0" max="65535" step="1" aria-label="Kills" placeholder="K" value={player.kills} onChange={(event) => update(index, 'kills', event.target.value)} /><input type="number" min="0" max="65535" step="1" aria-label="Deaths" placeholder="D" value={player.deaths} onChange={(event) => update(index, 'deaths', event.target.value)} /><input type="number" min="0" max="65535" step="1" aria-label="Assists" placeholder="A" value={player.assists} onChange={(event) => update(index, 'assists', event.target.value)} /></div>
    </div>)}
  </div>
}

export default function MatchForm({ onSaveMatch, onClose, playerNames, champions, isChampionLibraryLoading, championLibraryError, initialTeams, canWrite }) {
  const [form, setForm] = useState(() => emptyForm(initialTeams));
  const [activeTeam, setActiveTeam] = useState('blue');
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitStatus = canWrite && form.status !== "pending" ? "complete" : "pending";
  useEffect(() => { const closeOnEscape = (event) => { if (event.key === 'Escape' && !isCloseConfirmationOpen) setIsCloseConfirmationOpen(true); }; window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape); }, [isCloseConfirmationOpen]);
  async function submit(event, status = "complete") {
    event.preventDefault();
    setError("");
    const allPlayers = [...form.blue, ...form.red];
    const requiresCompleteDetails = status !== "draft";
    const names = allPlayers.map((player) => player.name.trim().toLowerCase());
    if (names.some((name) => !name)) return setError("Select all ten players before saving.");
    if (new Set(names).size !== names.length) return setError("Each player can only appear once in a match.");
    for (const [teamName, team] of [["Blue", form.blue], ["Red", form.red]]) {
      if (new Set(team.map((player) => player.role)).size !== ROLES.length) return setError(`${teamName} team must use each role once.`);
      if (requiresCompleteDetails && team.some((player) => !player.champion)) return setError(`Select a champion for every ${teamName.toLowerCase()} team player.`);
      if (requiresCompleteDetails && team.some((player) => [player.kills, player.deaths, player.assists].some((value) => value === ""))) return setError(`Enter K/D/A for every ${teamName.toLowerCase()} team player.`);
    }
    if (requiresCompleteDetails && !form.winner) return setError("Select the winning team before submitting the match.");
    const toPlayer = (player) => ({ ...player, name: player.name.trim(), kda: [player.kills, player.deaths, player.assists].every((value) => value !== "") ? [player.kills, player.deaths, player.assists].join('/') : "-" });
    setIsSubmitting(true);
    try {
      await onSaveMatch({ id: form.id, date: form.date, blue: form.blue.map(toPlayer), red: form.red.map(toPlayer), winner: form.winner, matchType: form.matchType, status, notes: form.notes.trim() });
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Could not save match.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return <div className="modal-backdrop" onMouseDown={() => setIsCloseConfirmationOpen(true)}><div className="panel entry-panel modal-panel" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
    <div className="panel-head"><div><p className="eyebrow">{!canWrite ? "SUBMIT CUSTOM" : form.status === "draft" ? "MATCH DRAFT" : form.matchType === "spin" ? "SPIN WHEEL CUSTOM" : "SUMMONER'S RIFT CUSTOM"}</p><h2>{form.status === "draft" ? "Complete custom" : "Log a custom"}</h2></div><button className="modal-close" type="button" onClick={() => setIsCloseConfirmationOpen(true)}>x</button></div>
    <datalist id="player-options">{playerNames.map((name) => <option value={name} key={name} />)}</datalist>
    <fieldset className="match-type-field"><legend>Custom type</legend><div className="match-type-options">{[["manual", "Summoner's Rift"], ["spin", "Spin wheel"]].map(([type, label]) => <label className={form.matchType === type ? "selected" : ""} key={type}><input type="radio" name="matchType" value={type} checked={form.matchType === type} onChange={(event) => setForm({ ...form, matchType: event.target.value })} /><span>{label}</span></label>)}</div></fieldset>
    <form onSubmit={(event) => submit(event, submitStatus)}><label>Date<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>{!canWrite && <div className="guest-review-note" role="note"><strong>Admin review required</strong><span>Your custom will only appear in match history and player statistics after an admin approves it.</span></div>}{championLibraryError && <div className="login-error">Champion library unavailable: {championLibraryError}</div>}<div className="mobile-team-tabs" role="tablist" aria-label="Teams">{['blue', 'red'].map((team) => <button className={activeTeam === team ? 'active' : ''} type="button" role="tab" aria-selected={activeTeam === team} key={team} onClick={() => setActiveTeam(team)}><span className={'team-dot ' + team} />{team[0].toUpperCase() + team.slice(1)} team</button>)}</div><div className="team-editors"><TeamEditor team="blue" players={form.blue} playerNames={playerNames} champions={champions} isChampionLibraryLoading={isChampionLibraryLoading} isActive={activeTeam === 'blue'} onChange={(blue) => setForm({ ...form, blue })} /><TeamEditor team="red" players={form.red} playerNames={playerNames} champions={champions} isChampionLibraryLoading={isChampionLibraryLoading} isActive={activeTeam === 'red'} onChange={(red) => setForm({ ...form, red })} /></div><div className="winner-row"><span className="label">WINNER</span><div className="winner-options">{['blue', 'red'].map((team) => <label key={team}><input type="radio" name="winner" value={team} checked={form.winner === team} onChange={(event) => setForm({ ...form, winner: event.target.value })} /><span>{team[0].toUpperCase() + team.slice(1)} team</span></label>)}</div></div><label>Notes<input maxLength="2000" placeholder="Optional context" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>{error && <div className="login-error" role="alert">{error}</div>}<div className="match-form-actions">{canWrite && form.status !== "pending" && <button className="ghost-btn" type="button" disabled={isSubmitting} onClick={(event) => submit(event, "draft")}>{isSubmitting ? "Saving..." : "Save draft"}</button>}<button className="primary-btn" type="submit" disabled={isSubmitting || Boolean(championLibraryError)}>{isSubmitting ? (canWrite ? "Saving match..." : "Submitting...") : !canWrite ? "Submit for review" : form.status === "pending" ? "Save review changes" : form.id ? "Complete match" : "Save completed match"} <span>-&gt;</span></button></div></form>
  </div>{isCloseConfirmationOpen && <DiscardConfirmation title="Close this match?" message="The teams, champions, and K/D/A values you entered will be lost." onCancel={() => setIsCloseConfirmationOpen(false)} onDiscard={onClose} />}</div>;
}
