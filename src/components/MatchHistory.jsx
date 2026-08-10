function MatchRow({ match, onDelete }) {
  return (
    <div className="match">
      <div className="match-date">{match.date}</div>
      <div>
        <div className="match-map">{match.map || "Custom game"}</div>
        <div className="match-teams">
          <span className="team-blue">{match.blue.join(", ")}</span> vs{" "}
          <span className="team-red">{match.red.join(", ")}</span>
        </div>
      </div>
      <div className={"result " + match.winner}>{match.winner.toUpperCase()} WIN</div>
      <button className="delete" aria-label="Delete match" onClick={() => onDelete(match)}>x</button>
    </div>
  );
}

export default function MatchHistory({ matches, search, onSearchChange, onDeleteMatch, onExport }) {
  const visibleMatches = matches.filter((match) =>
    (match.blue.join(" ") + " " + match.red.join(" ") + " " + match.map)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="panel history-panel">
      <div className="panel-head history-head">
        <div><p className="eyebrow">THE LEDGER</p><h2>Match history</h2></div>
        <div className="history-tools">
          <input type="search" placeholder="Search player..." value={search} onChange={(event) => onSearchChange(event.target.value)} />
          <button onClick={onExport} className="ghost-btn">Export JSON</button>
        </div>
      </div>
      <div className="history">
        {visibleMatches.length ? visibleMatches.map((match, index) => <MatchRow key={match.id || index} match={match} onDelete={onDeleteMatch} />) : <div className="empty">No matches found.<br />Use the form to add your first custom.</div>}
      </div>
    </div>
  );
}
