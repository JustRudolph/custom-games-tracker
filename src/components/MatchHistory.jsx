import { useState } from "react";
import { getPlayerLabel, getPlayerName } from "../utils/matches.js";
import RoleIcon from "./RoleIcon.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";

function PlayerLine({ player, team, champions }) {
  const details = getPlayerLabel(player);
  const champion = champions.find((item) => item.name.toLowerCase() === String(details.champion || "").toLowerCase());

  return (
    <div className={"match-player " + team}>
      <span className="match-player-name">{details.name}</span>
      <RoleIcon role={details.role} />
      <span className="match-player-champion">{champion && <img src={champion.icon} alt="" />}<span>{details.champion}</span></span>
      <span className="match-player-kda">{details.kda}</span>
    </div>
  );
}

function TeamSection({ match, team, champions }) {
  const isWinner = match.winner === team;
  const teamName = team === "blue" ? "Blue team" : "Red team";

  return (
    <section className={"match-team-section " + team}>
      <div className="match-team-head">
        <strong>{isWinner ? "Victory" : "Defeat"}</strong>
        <span>({teamName})</span>
      </div>
      <div className="match-columns">
        <span>Name</span>
        <span>Role</span>
        <span>Champion</span>
        <span>KDA</span>
      </div>
      {match[team].map((player, index) => (
        <PlayerLine
          key={getPlayerName(player) + index}
          player={player}
          team={team}
          champions={champions}
        />
      ))}
    </section>
  );
}

function CompactTeam({ players, champions, team, isWinner }) {
  return <div className={"compact-team " + team}><div className="compact-team-result"><strong>{isWinner ? "Victory" : "Defeat"}</strong><span>{team === "blue" ? "Blue team" : "Red team"}</span></div>{players.map((player, index) => {
    const details = getPlayerLabel(player);
    const champion = champions.find((item) => item.name.toLowerCase() === String(details.champion || "").toLowerCase());
    return <div className="compact-player" key={getPlayerName(player) + index}>{champion ? <img src={champion.icon} alt="" /> : <span className="compact-icon-fallback" />}<span>{details.name}</span></div>;
  })}</div>;
}

function DraftMatchup({ match, champions, onEdit, onDelete }) {
  return <div className="draft-matchup"><div className="draft-matchup-head"><div><span className="match-type-badge draft">Draft</span><strong>Match details pending</strong><span>{match.date} · {match.matchType === "spin" ? "Spin wheel custom" : "Summoner's Rift"}</span></div><div className="draft-match-actions"><button className="primary-btn" type="button" onClick={() => onEdit(match)}>Continue editing <span>-&gt;</span></button><button className="delete" type="button" aria-label="Delete draft" onClick={() => onDelete(match)}>x</button></div></div><div className="draft-teams"><CompactTeam players={match.blue} champions={champions} team="blue" isWinner={false} /><CompactTeam players={match.red} champions={champions} team="red" isWinner={false} /></div></div>;
}

function CollapsedMatchup({ match, champions, onExpand }) {
  return <div className={"collapsed-matchup winner-" + match.winner}><span className={"match-type-badge " + (match.matchType === "spin" ? "spin" : "manual")}>{match.matchType === "spin" ? "Spin wheel" : "Summoner's Rift"}</span><CompactTeam players={match.blue} champions={champions} team="blue" isWinner={match.winner === "blue"} /><CompactTeam players={match.red} champions={champions} team="red" isWinner={match.winner === "red"} /><button className="compact-expand" type="button" aria-label="Expand match" onClick={onExpand}>⌄</button></div>;
}

function MatchCard({ match, onDelete, onEdit, champions, canWrite }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (match.status === "draft") return <article className="match-card draft-card"><DraftMatchup match={match} champions={champions} onEdit={onEdit} onDelete={onDelete} /></article>;
  return (
    <article className={"match-card " + (isExpanded ? "expanded" : "collapsed")}>
      {isExpanded && <div className={"match-card-top " + (canWrite ? "can-write" : "guest")}>
        <span>{match.date}</span>
        <span className={"match-type-badge " + (match.matchType === "spin" ? "spin" : "manual")}>{match.matchType === "spin" ? "Spin wheel" : "Summoner's Rift"}</span>
        <span>{match.notes || "Custom game"}</span>
        <span className={"match-winner " + match.winner}>{match.winner} victory</span>
        {canWrite && <button
          className="delete"
          aria-label="Delete match"
          onClick={() => onDelete(match)}
        >
          x
        </button>}
        {isExpanded && <button className="collapse-match" type="button" aria-label="Collapse match" aria-expanded="true" onClick={() => setIsExpanded(false)}>⌃</button>}
      </div>}
      {isExpanded && <div className="match-card-body"><TeamSection match={match} team="blue" champions={champions} /><TeamSection match={match} team="red" champions={champions} /></div>}
      {!isExpanded && <CollapsedMatchup match={match} champions={champions} onExpand={() => setIsExpanded(true)} />}
    </article>
  );
}

export default function MatchHistory({
  matches,
  onDeleteMatch,
  onEditMatch,
  onExport,
  champions,
  canWrite,
}) {
  const [matchPendingDelete, setMatchPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  async function deleteMatch() { if (!matchPendingDelete || isDeleting) return; setDeleteError(""); setIsDeleting(true); try { await onDeleteMatch(matchPendingDelete); setMatchPendingDelete(null); } catch (error) { setDeleteError(error.message || "Could not delete match."); } finally { setIsDeleting(false); } }
  return (
    <div className="panel history-panel">
      <div className="panel-head history-head">
        <div>
          <p className="eyebrow">MATCH ARCHIVE</p>
          <h2>Match history</h2>
        </div>
        {canWrite && <div className="history-tools">
          <button onClick={onExport} className="ghost-btn">
            Export JSON
          </button>
        </div>}
      </div>
      <div className="history">
        {matches.length ? (
          matches.map((match, index) => (
            <MatchCard
              key={match.id || index}
              match={match}
              onDelete={(match) => { setDeleteError(""); setMatchPendingDelete(match); }}
              onEdit={onEditMatch}
              champions={champions}
              canWrite={canWrite}
            />
          ))
        ) : (
          <div className="empty">{canWrite ? "No matches have been logged yet. Log your first custom when you're ready." : "No matches have been logged yet."}</div>
        )}
      </div>
      {matchPendingDelete && <ConfirmationModal eyebrow="DELETE MATCH" title={`Delete match from ${matchPendingDelete.date}?`} message="This removes the match and its player statistics permanently." confirmLabel="Delete match" isWorking={isDeleting} error={deleteError} onCancel={() => setMatchPendingDelete(null)} onConfirm={deleteMatch} />}
    </div>
  );
}
