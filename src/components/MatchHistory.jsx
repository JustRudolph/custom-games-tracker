import { useState } from "react";
import { getPlayerLabel, getPlayerName } from "../utils/matches.js";
import RoleIcon from "./RoleIcon.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";

function getMatchTypeLabel(matchType, compact = false) {
  if (matchType === "spin") return compact ? "Spin wheel" : "Spin wheel custom";
  return compact ? "Summoner's Rift" : "Summoner's Rift custom";
}

function PlayerLine({ player, team, champions }) {
  const details = getPlayerLabel(player);
  const champion = champions.find((item) => item.name.toLowerCase() === String(details.champion || "").toLowerCase());

  return (
    <div className={"match-player " + team}>
      <RoleIcon role={details.role} />
      <span className="match-player-name">{details.name}</span>
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
        <span>Role</span>
        <span>Name</span>
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
  return <div className="draft-matchup"><div className="draft-matchup-head"><div><span className="match-type-badge draft">Draft</span><strong>Match details pending</strong><span>{match.date} · {getMatchTypeLabel(match.matchType)}</span></div><div className="draft-match-actions"><button className="primary-btn" type="button" onClick={() => onEdit(match)}>Continue editing <span>-&gt;</span></button><button className="delete" type="button" aria-label="Delete draft" onClick={() => onDelete(match)}>x</button></div></div><div className="draft-teams"><CompactTeam players={match.blue} champions={champions} team="blue" isWinner={false} /><CompactTeam players={match.red} champions={champions} team="red" isWinner={false} /></div></div>;
}

function PendingMatchup({ match, champions, onEdit, onApprove, onDelete, isApproving, error }) {
  return <div className="draft-matchup pending-matchup"><div className="draft-matchup-head"><div><span className="match-type-badge pending">Pending review</span><strong>Guest submission</strong><span>{match.date} · {getMatchTypeLabel(match.matchType)}</span></div><div className="draft-match-actions"><button className="ghost-btn" type="button" disabled={isApproving} onClick={() => onEdit(match)}>Review / edit</button><button className="primary-btn" type="button" disabled={isApproving} onClick={() => onApprove(match)}>{isApproving ? "Approving..." : "Approve"} <span>-&gt;</span></button><button className="delete" type="button" disabled={isApproving} aria-label="Delete pending submission" onClick={() => onDelete(match)}>x</button></div></div>{error && <div className="login-error" role="alert">{error}</div>}<div className="draft-teams"><CompactTeam players={match.blue} champions={champions} team="blue" isWinner={match.winner === "blue"} /><CompactTeam players={match.red} champions={champions} team="red" isWinner={match.winner === "red"} /></div></div>;
}

function CollapsedMatchup({ match, champions, onExpand, showLoggedBy }) {
  return <div className={"collapsed-matchup winner-" + match.winner}><div className="collapsed-match-meta"><span>{match.date}</span><strong>{getMatchTypeLabel(match.matchType)}</strong>{showLoggedBy && <small>Logged by {match.loggedBy || "Guest"}</small>}</div><CompactTeam players={match.blue} champions={champions} team="blue" isWinner={match.winner === "blue"} /><CompactTeam players={match.red} champions={champions} team="red" isWinner={match.winner === "red"} /><button className="compact-expand" type="button" aria-label="Expand match" onClick={onExpand}>&#x2304;</button></div>;
}

function MatchCard({ match, onDelete, onEdit, onApprove, approvingMatchId, approvalError, champions, canWrite, isOwner }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (match.status === "draft") return <article className="match-card draft-card"><DraftMatchup match={match} champions={champions} onEdit={onEdit} onDelete={onDelete} /></article>;
  if (match.status === "pending") return <article className="match-card pending-card"><PendingMatchup match={match} champions={champions} onEdit={onEdit} onApprove={onApprove} onDelete={onDelete} isApproving={approvingMatchId === match.id} error={approvalError?.id === match.id ? approvalError.message : ""} /></article>;
  return (
    <article className={"match-card " + (isExpanded ? "expanded" : "collapsed")}>
      {isExpanded && <div className={"match-card-top " + (canWrite ? "can-write" : "guest")}>
        <span>{match.date}</span>
        <span className={"match-type-badge " + (match.matchType === "spin" ? "spin" : "manual")}>{getMatchTypeLabel(match.matchType, true)}</span>
        <span>{match.notes || "Custom game"}</span>
        {isOwner && <span className="match-logged-by">Logged by {match.loggedBy || "Guest"}</span>}
        <span className={"match-winner " + match.winner}>{match.winner} victory</span>
        {canWrite && <button className="ghost-btn edit-match" type="button" onClick={() => onEdit(match)}>Edit</button>}
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
      {!isExpanded && <CollapsedMatchup match={match} champions={champions} showLoggedBy={isOwner} onExpand={() => setIsExpanded(true)} />}
    </article>
  );
}

export default function MatchHistory({
  matches,
  onDeleteMatch,
  onEditMatch,
  onApproveMatch,
  onExport,
  champions,
  canWrite,
  isOwner,
  onRefresh,
  isRefreshing,
}) {
  const [matchLimit, setMatchLimit] = useState(10);
  const [matchPendingDelete, setMatchPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [approvingMatchId, setApprovingMatchId] = useState("");
  const [approvalError, setApprovalError] = useState(null);
  const visibleMatches = (canWrite
    ? matches
    : matches.filter((match) => match.status === "complete")
  ).map((match, index) => ({ match, index })).sort((first, second) => {
    const priority = { pending: 0, draft: 1, complete: 2 };
    return (priority[first.match.status] ?? 3) - (priority[second.match.status] ?? 3) || first.index - second.index;
  }).map(({ match }) => match);
  const shownMatches = visibleMatches.slice(0, matchLimit);
  async function deleteMatch() { if (!matchPendingDelete || isDeleting) return; setDeleteError(""); setIsDeleting(true); try { await onDeleteMatch(matchPendingDelete); setMatchPendingDelete(null); } catch (error) { setDeleteError(error.message || "Could not delete match."); } finally { setIsDeleting(false); } }
  async function approveMatch(match) { if (approvingMatchId) return; setApprovalError(null); setApprovingMatchId(match.id); try { await onApproveMatch(match); } catch (error) { setApprovalError({ id: match.id, message: error.message || "Could not approve submission." }); } finally { setApprovingMatchId(""); } }
  return (
    <div className="panel history-panel">
      <div className="panel-head history-head">
        <div>
          <p className="eyebrow">MATCH ARCHIVE</p>
          <h2>Match history</h2>
        </div>
        <div className="history-tools">
          <button onClick={onRefresh} className="ghost-btn" type="button" disabled={isRefreshing}>{isRefreshing ? "Updating..." : "Update"}</button>
          {canWrite && <button onClick={onExport} className="ghost-btn">Export JSON</button>}
        </div>
      </div>
      <div className="history">
        {visibleMatches.length ? (
          shownMatches.map((match, index) => (
            <MatchCard
              key={match.id || index}
              match={match}
              onDelete={(match) => { setDeleteError(""); setMatchPendingDelete(match); }}
              onEdit={onEditMatch}
              onApprove={approveMatch}
              approvingMatchId={approvingMatchId}
              approvalError={approvalError}
              champions={champions}
              canWrite={canWrite}
              isOwner={isOwner}
            />
          ))
        ) : (
          <div className="empty">{canWrite ? "No matches have been logged yet. Log your first custom when you're ready." : "No matches have been logged yet."}</div>
        )}
      </div>
      {visibleMatches.length > matchLimit && <button className="secondary-btn show-more-matches" type="button" onClick={() => setMatchLimit((current) => current + 10)}>Show more matches ({visibleMatches.length - matchLimit} remaining)</button>}
      {matchPendingDelete && <ConfirmationModal eyebrow="DELETE MATCH" title={`Delete match from ${matchPendingDelete.date}?`} message="This removes the match and its player statistics permanently." confirmLabel="Delete match" isWorking={isDeleting} error={deleteError} onCancel={() => setMatchPendingDelete(null)} onConfirm={deleteMatch} />}
    </div>
  );
}
