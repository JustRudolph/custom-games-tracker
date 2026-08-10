import { useState } from "react";
import { getPlayerLabel, getPlayerName, getRankLabel } from "../utils/matches.js";
import RoleIcon from "./RoleIcon.jsx";

function PlayerLine({ player, team, champions }) {
  const details = getPlayerLabel(player);
  const champion = champions.find((item) => item.name.toLowerCase() === String(details.champion || "").toLowerCase());

  return (
    <div className={"match-player " + team}>
      <span className="match-player-name">{details.name}</span>
      <RoleIcon role={details.role} />
      <span className="match-player-rank">{getRankLabel(details.rank)}</span>
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
        <span>Rank</span>
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

function CollapsedMatchup({ match, champions, onExpand }) {
  return <div className={"collapsed-matchup winner-" + match.winner}><CompactTeam players={match.blue} champions={champions} team="blue" isWinner={match.winner === "blue"} /><CompactTeam players={match.red} champions={champions} team="red" isWinner={match.winner === "red"} /><button className="compact-expand" type="button" aria-label="Expand match" onClick={onExpand}>⌄</button></div>;
}

function MatchCard({ match, onDelete, champions }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <article className={"match-card " + (isExpanded ? "expanded" : "collapsed")}>
      {isExpanded && <div className="match-card-top">
        <span>{match.date}</span>
        <span>{match.notes || "Custom game"}</span>
        <span className={"match-winner " + match.winner}>{match.winner} victory</span>
        <button
          className="delete"
          aria-label="Delete match"
          onClick={() => onDelete(match)}
        >
          x
        </button>
        {isExpanded && <button className="collapse-match" type="button" aria-label="Collapse match" aria-expanded="true" onClick={() => setIsExpanded(false)}>⌃</button>}
      </div>}
      {isExpanded && <div className="match-card-body"><TeamSection match={match} team="blue" champions={champions} /><TeamSection match={match} team="red" champions={champions} /></div>}
      {!isExpanded && <CollapsedMatchup match={match} champions={champions} onExpand={() => setIsExpanded(true)} />}
    </article>
  );
}

export default function MatchHistory({
  matches,
  search,
  onSearchChange,
  onDeleteMatch,
  onExport,
  champions,
}) {
  const visibleMatches = matches.filter((match) =>
    [...match.blue, ...match.red]
      .map(getPlayerName)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="panel history-panel">
      <div className="panel-head history-head">
        <div>
          <p className="eyebrow">THE LEDGER</p>
          <h2>Match history</h2>
        </div>
        <div className="history-tools">
          <input
            type="search"
            placeholder="Search player..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <button onClick={onExport} className="ghost-btn">
            Export JSON
          </button>
        </div>
      </div>
      <div className="history">
        {visibleMatches.length ? (
          visibleMatches.map((match, index) => (
            <MatchCard
              key={match.id || index}
              match={match}
              onDelete={onDeleteMatch}
              champions={champions}
            />
          ))
        ) : (
          <div className="empty">
            No matches found.
            <br />
            Use the form to add your first custom.
          </div>
        )}
      </div>
    </div>
  );
}
