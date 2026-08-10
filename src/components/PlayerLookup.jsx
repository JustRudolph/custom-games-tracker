import { useMemo } from "react";
import PlayerMatchList from "./PlayerMatchList.jsx";
import PlayerStatCard from "./PlayerStatCard.jsx";

export default function PlayerLookup({ players, matches, champions, query, onQueryChange, dataError, onRetry, onBack }) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(
    () => normalizedQuery
      ? players.filter(([name]) => name.toLowerCase().includes(normalizedQuery)).slice(0, 6)
      : [],
    [normalizedQuery, players],
  );
  const exactMatch = players.find(([name]) => name.toLowerCase() === normalizedQuery);
  const selectedPlayer = exactMatch;
  const bestChampion = selectedPlayer
    ? champions.find((item) => item.name.toLowerCase() === selectedPlayer[1].bestChampion.toLowerCase())
    : null;

  return (
    <main className="player-lookup">
      <div className="full-leaderboard-head">
        <div>
          <p className="eyebrow">PLAYER SEARCH</p>
          <h1>Find a player</h1>
        </div>
        <button className="theme-toggle" onClick={onBack}>Back to dashboard</button>
      </div>
      {dataError && <div className="data-error">Database connection failed: {dataError} <button className="ghost-btn" onClick={onRetry}>Retry</button></div>}
      <section className="player-lookup-content">
        {normalizedQuery && !exactMatch && (
          <div className="player-search-results">
            {results.length ? results.map(([name]) => (
              <button key={name} type="button" onClick={() => onQueryChange(name)}>{name}</button>
            )) : <span>No player found.</span>}
          </div>
        )}
        {selectedPlayer && (
          <PlayerStatCard name={selectedPlayer[0]} stat={selectedPlayer[1]} champion={bestChampion}>
            <PlayerMatchList name={selectedPlayer[0]} matches={matches} champions={champions} />
          </PlayerStatCard>
        )}
      </section>
    </main>
  );
}
