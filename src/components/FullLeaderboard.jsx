import { useMemo, useState } from "react";
import { getAverageKda, getWinRate } from "../utils/matches.js";
import RoleIcon from "./RoleIcon.jsx";

export default function FullLeaderboard({ players, onBack }) {
  const [sort, setSort] = useState({ key: "", direction: "asc" });
  const sortedPlayers = useMemo(() => {
    if (!sort.key) return players;
    return [...players].sort(([, first], [, second]) => {
      const firstValue = sort.key === "winRate" ? getWinRate(first) : getAverageKda(first);
      const secondValue = sort.key === "winRate" ? getWinRate(second) : getAverageKda(second);
      const difference = firstValue - secondValue;
      return (sort.direction === "asc" ? difference : -difference) || second.games - first.games || first.displayName.localeCompare(second.displayName);
    });
  }, [players, sort]);
  function toggleSort(key) {
    setSort((current) => {
      if (current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: "asc" };
    });
  }
  const sortLabel = (key, label) => <button type="button" className={"leaderboard-sort " + (sort.key === key ? "active" : "")} onClick={() => toggleSort(key)}>{label}<span aria-hidden="true">{sort.key === key ? (sort.direction === "asc" ? " ↑" : " ↓") : " ↕"}</span></button>;
  return (
    <main className="full-leaderboard">
      <div className="full-leaderboard-head">
        <div>
          <p className="eyebrow">ALL PLAYERS</p>
          <h1>Leaderboard</h1>
        </div>
        <button className="theme-toggle" onClick={onBack}>
          Back to dashboard
        </button>
      </div>
      <section className="panel leaderboard-table">
        <div className="leaderboard-table-head">
          <span>Rank</span>
          <span>Player</span>
          <span>Record</span>
          {sortLabel("winRate", "Win rate")}
          {sortLabel("averageKda", "Avg KDA")}
          <span>Best champion</span>
          <span>Worst champion</span>
          <span>Best role</span>
        </div>
        {players.length ? (
          sortedPlayers.map(([name, stat], index) => (
            <div className="leaderboard-table-row" key={name}>
              <span className="leaderboard-rank">
                {String(index + 1).padStart(2, "0")}
              </span>
              <strong>{name}</strong>
              <span className="leaderboard-record">
                {stat.wins}W - {stat.games - stat.wins}L
              </span>
              <span className="table-rate">{getWinRate(stat)}%</span>
              <span className="leaderboard-kda">{getAverageKda(stat)}</span>
              <strong>{stat.bestChampion}</strong>
              <strong>{stat.worstChampion}</strong>
              <strong className="leaderboard-role"><RoleIcon role={stat.bestRole} /></strong>
            </div>
          ))
        ) : (
          <div className="empty">No player stats yet.</div>
        )}
      </section>
    </main>
  );
}
