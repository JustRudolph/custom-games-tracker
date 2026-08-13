import { useEffect, useMemo, useRef, useState } from "react";
import { ROLES, today } from "../utils/matches.js";
import { findFirstPlayerMatch } from "../utils/players.js";
import RoleIcon from "./RoleIcon.jsx";
import SpinWheel from "./SpinWheel.jsx";
import DiscardConfirmation from "./DiscardConfirmation.jsx";

function TeamRoster({ title, players, assignments }) {
  return (
    <section className="spin-team-roster">
      <h3>{title}</h3>
      {players.length ? players.map((name) => (
        <div className="spin-team-player" key={name}>
          <strong>{name}</strong>
          {assignments[name] ? <span><RoleIcon role={assignments[name]} />{assignments[name]}</span> : <span>Waiting</span>}
        </div>
      )) : <div className="spin-team-empty">Waiting for the draw</div>}
    </section>
  );
}

const toMatchPlayer = (name, assignments) => ({ name, role: assignments[name], champion: "", kills: "", deaths: "", assists: "" });

function buildSpinDraft(teamOne, teamTwo, assignments) {
  return {
    date: today(),
    blue: teamOne.map((name) => toMatchPlayer(name, assignments)),
    red: teamTwo.map((name) => toMatchPlayer(name, assignments)),
    winner: "",
    matchType: "spin",
    status: "draft",
    notes: "",
  };
}

function formatTeamsForClipboard(teamOne, teamTwo, assignments) {
  const formatTeam = (title, players) => [title, ...ROLES.map((role) => {
    const player = players.find((name) => assignments[name] === role);
    return `${role}: ${player || "-"}`;
  })].join("\n");

  return `${formatTeam("Team 1", teamOne)}\n\n${formatTeam("Team 2", teamTwo)}`;
}

export default function SpinCustomModal({ playerNames, canWrite, onClose, onUseTeams, onSaveDraft }) {
  const [query, setQuery] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [drawPool, setDrawPool] = useState(null);
  const [teamOne, setTeamOne] = useState([]);
  const [teamTwo, setTeamTwo] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [selectedRolePlayer, setSelectedRolePlayer] = useState("");
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false);
  const [savedDraft, setSavedDraft] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const hasStartedDraftSave = useRef(false);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && setIsCloseConfirmationOpen(true);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const availablePlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return playerNames
      .filter((name) => !selectedPlayers.includes(name))
      .filter((name) => !normalizedQuery || name.toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [playerNames, query, selectedPlayers]);

  const teamOneComplete = teamOne.length === 5 && teamOne.every((name) => assignments[name]);
  const activeTeam = teamOne.length < 5 ? [] : teamOneComplete ? teamTwo : teamOne;
  const unassignedPlayers = activeTeam.filter((name) => !assignments[name]);
  const availableRoles = ROLES.filter((role) => !activeTeam.some((name) => assignments[name] === role));
  const rolesComplete = teamOne.length === 5 && teamTwo.length === 5 && [...teamOne, ...teamTwo].every((name) => assignments[name]);

  useEffect(() => {
    if (!rolesComplete || !canWrite || hasStartedDraftSave.current) return;

    saveCompletedDraft();
  }, [assignments, canWrite, onSaveDraft, rolesComplete, teamOne, teamTwo]);

  async function saveCompletedDraft() {
    if (hasStartedDraftSave.current || isSavingDraft) return;

    hasStartedDraftSave.current = true;
    setIsSavingDraft(true);
    setDraftError("");
    try {
      setSavedDraft(await onSaveDraft(buildSpinDraft(teamOne, teamTwo, assignments)));
    } catch (error) {
      hasStartedDraftSave.current = false;
      setDraftError(error.message || "Could not save the draft.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  function togglePlayer(name) {
    if (drawPool) return;
    setSelectedPlayers((current) => current.includes(name) ? current.filter((player) => player !== name) : current.length < 10 ? [...current, name] : current);
    setQuery("");
  }

  function selectFirstMatchingPlayer(event) {
    if (event.key !== "Enter") return;

    const match = findFirstPlayerMatch(availablePlayers, query);
    if (!match) return;

    event.preventDefault();
    togglePlayer(match);
  }

  function startDraw() {
    setDrawPool([...selectedPlayers]);
  }

  function addTeamOnePlayer(name) {
    const remaining = drawPool.filter((player) => player !== name);
    const nextTeamOne = [...teamOne, name];
    setTeamOne(nextTeamOne);
    if (nextTeamOne.length === 5) {
      setTeamTwo(remaining);
      setDrawPool([]);
    } else {
      setDrawPool(remaining);
    }
  }

  function assignRole(role) {
    if (!selectedRolePlayer) return;
    const finalPlayer = unassignedPlayers.find((name) => name !== selectedRolePlayer);
    const finalRole = availableRoles.find((availableRole) => availableRole !== role);
    setAssignments((current) => {
      const nextAssignments = { ...current, [selectedRolePlayer]: role };
      if (unassignedPlayers.length === 2 && availableRoles.length === 2 && finalPlayer && finalRole) {
        nextAssignments[finalPlayer] = finalRole;
      }
      return nextAssignments;
    });
    setSelectedRolePlayer("");
  }

  function useTeams() {
    onUseTeams(savedDraft || buildSpinDraft(teamOne, teamTwo, assignments));
  }

  async function copyTeams() {
    try {
      await navigator.clipboard.writeText(formatTeamsForClipboard(teamOne, teamTwo, assignments));
      setCopyStatus("Teams copied");
    } catch {
      setCopyStatus("Could not copy teams");
    }
  }

  const drawingTeams = drawPool !== null && teamOne.length < 5;
  const assigningRoles = teamOne.length === 5 && !rolesComplete;

  return (
    <div className="modal-backdrop" onMouseDown={() => setIsCloseConfirmationOpen(true)}>
      <section className="panel spin-custom-modal" role="dialog" aria-modal="true" aria-labelledby="spin-custom-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="panel-head">
          <div><p className="eyebrow">SPIN WHEEL CUSTOM</p><h2 id="spin-custom-title">Build the teams</h2></div>
          <button className="modal-close" type="button" onClick={() => setIsCloseConfirmationOpen(true)}>x</button>
        </div>

        {drawPool === null && (
          <section className="spin-player-selection">
            <div className="spin-selection-head"><strong>Players</strong><span>{selectedPlayers.length}/10 selected</span></div>
            <input type="search" autoComplete="off" placeholder="Search saved players..." value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={selectFirstMatchingPlayer} />
            {query && <div className="spin-player-results">{availablePlayers.length ? availablePlayers.map((name) => <button type="button" key={name} onClick={() => togglePlayer(name)}>{name}</button>) : <span>No players found.</span>}</div>}
            <div className="spin-selected-players">{selectedPlayers.map((name) => <button type="button" key={name} onClick={() => togglePlayer(name)}>{name}<span>x</span></button>)}</div>
            <button className="primary-btn spin-start-button" type="button" disabled={selectedPlayers.length !== 10} onClick={startDraw}>Start team draw <span>-&gt;</span></button>
          </section>
        )}

        {drawPool !== null && (
          <div className="spin-custom-layout">
            <div className="spin-rosters"><TeamRoster title="Team 1" players={teamOne} assignments={assignments} /><TeamRoster title="Team 2" players={teamTwo} assignments={assignments} /></div>
            <section className="spin-stage">
              {drawingTeams && <><div className="spin-stage-head"><p className="eyebrow">TEAM DRAW</p><h3>Spin for Team 1</h3><span>{teamOne.length}/5 selected</span></div><SpinWheel options={drawPool} buttonLabel="Spin player" resultButtonLabel="Continue to roles" continueAfterResult={teamOne.length < 4} onResult={addTeamOnePlayer} /></>}
              {assigningRoles && <><div className="spin-stage-head"><p className="eyebrow">ROLE DRAW</p><h3>{teamOneComplete ? "Team 2 roles" : "Team 1 roles"}</h3><span>{unassignedPlayers.length} players left</span></div><label>Player<select value={selectedRolePlayer} onChange={(event) => setSelectedRolePlayer(event.target.value)}><option value="">Select player</option>{unassignedPlayers.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><SpinWheel options={availableRoles} buttonLabel="Spin role" resultButtonLabel="Confirm role" disabled={!selectedRolePlayer} allowRespin renderOption={(role) => <span className="spin-role-option"><RoleIcon role={role} /><span>{role}</span></span>} onResult={assignRole} /></>}
              {rolesComplete && <div className="spin-complete"><p className="eyebrow">TEAMS READY</p><h3>Roles are assigned</h3>{canWrite ? <p className="spin-review-note">{isSavingDraft ? "Saving draft..." : savedDraft ? "Draft saved to match history." : "The draft could not be saved."}</p> : <p className="spin-review-note">Add the match details next, then submit it for admin review.</p>}{draftError && <div className="login-error" role="alert">{draftError}</div>}{canWrite && draftError && <button className="ghost-btn spin-retry-draft" type="button" onClick={saveCompletedDraft}>Retry saving draft</button>}<div className="spin-complete-actions"><button className="ghost-btn" type="button" onClick={copyTeams}>Copy teams</button><button className="primary-btn" type="button" disabled={canWrite && !savedDraft} onClick={useTeams}>{canWrite ? "Complete draft" : "Continue to submission"} <span>-&gt;</span></button></div>{copyStatus && <span className="spin-copy-status" role="status">{copyStatus}</span>}</div>}
            </section>
          </div>
        )}
      </section>
      {isCloseConfirmationOpen && <DiscardConfirmation title="Close the wheel?" message="The selected players, team draw, and role assignments will be lost." onCancel={() => setIsCloseConfirmationOpen(false)} onDiscard={onClose} />}
    </div>
  );
}
