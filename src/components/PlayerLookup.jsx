import PlayerMatchList from "./PlayerMatchList.jsx";
import PlayerStatCard from "./PlayerStatCard.jsx";
import { getPlayerBestPerformance } from "../utils/matches.js";

export default function PlayerLookup({ players, matches, champions, selectedName, dataError, onRetry, onBack }) {
  const selectedPlayer = players.find(([name]) => name.toLowerCase() === selectedName.toLowerCase());
  const bestChampion = selectedPlayer
    ? champions.find((item) => item.name.toLowerCase() === selectedPlayer[1].bestChampion.toLowerCase())
    : null;
  const bestPerformance = selectedPlayer ? getPlayerBestPerformance(matches, selectedPlayer[0]) : null;
  const bestPerformanceChampion = bestPerformance
    ? champions.find((item) => item.name.toLowerCase() === bestPerformance.champion.toLowerCase())
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
        {selectedPlayer && (
          <PlayerStatCard name={selectedPlayer[0]} stat={selectedPlayer[1]} champion={bestChampion} bestPerformance={bestPerformance} bestPerformanceChampion={bestPerformanceChampion}>
            <PlayerMatchList name={selectedPlayer[0]} matches={matches} champions={champions} />
          </PlayerStatCard>
        )}
      </section>
    </main>
  );
}
